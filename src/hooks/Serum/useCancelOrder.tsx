import { useCallback } from 'react';
import {
  PSY_AMERICAN_PROGRAM_IDS,
  ProgramVersions,
  serumInstructions,
} from '@mithraic-labs/psy-american';

import { PublicKey, Transaction } from '@solana/web3.js';
import useSerum from '../useSerum';
import { useConnectedWallet } from '@saberhq/use-solana';
import useConnection from '../useConnection';
import { useSettleFunds } from './useSettleFunds';
import useNotifications from '../useNotifications';
import useSendTransaction from '../useSendTransaction';
import { useAmericanPsyOptionsProgram } from '../useAmericanPsyOptionsProgram';
import { useSubscribeSerumOrderbook } from '../../hooks/Serum';
import { useRecoilValue } from 'recoil';
import { activeNetwork, optionsMap } from '../../recoil';
import { getSupportedMarketsByNetwork } from '../../utils/networkInfo';

export const useCancelOrder = (
  serumMarketAddress: string,
  optionKey: PublicKey,
) => {
  const option = useRecoilValue(optionsMap(optionKey.toString()));
  const network = useRecoilValue(activeNetwork);
  const program = useAmericanPsyOptionsProgram();
  const { connection, dexProgramId } = useConnection();
  const wallet = useConnectedWallet();
  const { serumMarkets } = useSerum();
  const { serumMarket } = serumMarkets[serumMarketAddress] || {};
  const { makeSettleFundsTx } = useSettleFunds(serumMarketAddress, optionKey);
  const { pushErrorNotification } = useNotifications();
  const { sendSignedTransaction } = useSendTransaction();
  useSubscribeSerumOrderbook(serumMarket?.address.toString() ?? '');

  return useCallback(
    async (order) => {
      if (!serumMarket || !option || !wallet?.publicKey) {
        return;
      }
      try {
        const settleTx = await makeSettleFundsTx();

        if (!settleTx) {
          return;
        }

        const marketMetas = getSupportedMarketsByNetwork(network.name);
        const optionMarketMeta = marketMetas.find(
          (omm) => omm.optionMarketAddress === optionKey.toString(),
        );

        let cancelTx: Transaction;
        if (
          optionMarketMeta &&
          PSY_AMERICAN_PROGRAM_IDS[
            optionMarketMeta.psyOptionsProgramId.toString()
          ] === ProgramVersions.V1
        ) {
          cancelTx = await serumMarket.makeCancelOrderTransaction(
            connection,
            wallet.publicKey,
            order,
          );
        } else {
          if (!program || !dexProgramId) {
            return;
          }
          const ix = await serumInstructions.cancelOrderInstructionV2(
            program,
            option.key,
            dexProgramId,
            serumMarket.address,
            order,
            undefined,
          );
          cancelTx = new Transaction().add(ix);
        }
        const { blockhash } = await connection.getRecentBlockhash();
        cancelTx.recentBlockhash = blockhash;
        cancelTx.feePayer = wallet.publicKey;
        const [signedCancelTx, signedSettleTx] =
          await wallet.signAllTransactions([cancelTx, settleTx]);

        await sendSignedTransaction({
          signedTransaction: signedCancelTx,
          connection,
          sendingMessage: 'Processing: Cancel Order',
          successMessage: 'Confirmed: Cancel Order',
        });

        await sendSignedTransaction({
          signedTransaction: signedSettleTx,
          connection,
          sendingMessage: 'Processing: Settle Funds',
          successMessage: 'Confirmed: Settle Funds',
        });
      } catch (err) {
        pushErrorNotification(err);
      }
    },
    [
      serumMarket,
      option,
      wallet,
      makeSettleFundsTx,
      network.name,
      connection,
      sendSignedTransaction,
      optionKey,
      program,
      dexProgramId,
      pushErrorNotification,
    ],
  );
};
