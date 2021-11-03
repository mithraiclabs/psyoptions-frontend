import { useCallback } from 'react';
import {
  PSY_AMERICAN_PROGRAM_IDS,
  ProgramVersions,
  serumInstructions,
} from '@mithraic-labs/psy-american';

import { PublicKey, Transaction } from '@solana/web3.js';
import useSerum from '../useSerum';
import { useConnectedWallet } from "@saberhq/use-solana";
import useConnection from '../useConnection';
import { useSettleFunds } from './useSettleFunds';
import useNotifications from '../useNotifications';
import useSendTransaction from '../useSendTransaction';
import { OptionMarket } from '../../types';
import { useAmericanPsyOptionsProgram } from '../useAmericanPsyOptionsProgram';
import { useSubscribeSerumOrderbook } from '../../hooks/Serum';

export const useCancelOrder = (
  serumMarketAddress: string,
  optionMarket: OptionMarket,
) => {
  const program = useAmericanPsyOptionsProgram();
  const { connection } = useConnection();
  const wallet = useConnectedWallet();
  const { serumMarkets } = useSerum();
  const { serumMarket } = serumMarkets[serumMarketAddress] || {};
  const { makeSettleFundsTx } = useSettleFunds(
    serumMarketAddress,
    optionMarket,
  );
  const { pushErrorNotification } = useNotifications();
  const { sendSignedTransaction } = useSendTransaction();
  useSubscribeSerumOrderbook(serumMarket?.address.toString() ?? '');

  return useCallback(async (order) => {
    if (!serumMarket || !optionMarket || !wallet?.publicKey)
      return;
    try {
      const settleTx = await makeSettleFundsTx();

      if (!settleTx)
        return;

      let cancelTx: Transaction;
      if (
        PSY_AMERICAN_PROGRAM_IDS[
          optionMarket.psyOptionsProgramId.toString()
        ] === ProgramVersions.V1
      ) {
        cancelTx = await serumMarket.makeCancelOrderTransaction(
          connection,
          wallet.publicKey,
          order,
        );
      } else {
        const ix = await serumInstructions.cancelOrderInstructionV2(
          program,
          optionMarket.pubkey,
          new PublicKey(optionMarket.serumProgramId),
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
  }, [
    connection,
    makeSettleFundsTx,
    program,
    optionMarket,
    pushErrorNotification,
    sendSignedTransaction,
    serumMarket,
    wallet,
  ],
  );
};
