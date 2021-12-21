import {
  ProgramVersions,
  PSY_AMERICAN_PROGRAM_IDS,
  serumInstructions,
} from '@mithraic-labs/psy-american';
import { DexInstructions, OpenOrders } from '@project-serum/serum';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { activeNetwork } from '../../recoil';
import { NotificationSeverity } from '../../types';
import { getSupportedMarketsByNetwork } from '../../utils/networkInfo';
import { useAmericanPsyOptionsProgram } from '../useAmericanPsyOptionsProgram';
import useConnection from '../useConnection';
import useNotifications from '../useNotifications';

export const useCloseOpenOrders = () => {
  const program = useAmericanPsyOptionsProgram();
  const { dexProgramId } = useConnection();
  const { pushNotification, pushErrorNotification } = useNotifications();
  const network = useRecoilValue(activeNetwork);

  return useCallback(
    async (optionKey: PublicKey, openOrders: OpenOrders) => {
      if (!program || !dexProgramId) {
        return;
      }
      const closeOpenOrdersTransaction = new Transaction();
      const marketMetas = getSupportedMarketsByNetwork(network.name);
      const optionMarketMeta = marketMetas.find(
        (omm) => omm.optionMarketAddress === optionKey.toString(),
      );
      if (
        optionMarketMeta &&
        PSY_AMERICAN_PROGRAM_IDS[optionMarketMeta.psyOptionsProgramId] ===
          ProgramVersions.V1
      ) {
        const ix = DexInstructions.closeOpenOrders({
          market: openOrders.market,
          openOrders: openOrders.address,
          owner: program.provider.wallet.publicKey,
          solWallet: program.provider.wallet.publicKey,
          programId: optionMarketMeta.psyOptionsProgramId,
        });
        closeOpenOrdersTransaction.add(ix);
      } else {
        const ix = await serumInstructions.closeOpenOrdersInstruction(
          program,
          optionKey,
          dexProgramId,
          openOrders.market,
          openOrders.address,
          undefined,
        );
        closeOpenOrdersTransaction.add(ix);
      }
      pushNotification({
        severity: NotificationSeverity.INFO,
        message: 'Processing: Close OpenOrders',
      });
      try {
        await program.provider.send(closeOpenOrdersTransaction);
        pushNotification({
          severity: NotificationSeverity.SUCCESS,
          message: 'Processing: Successfully closed OpenOrders',
        });
      } catch (err) {
        pushErrorNotification(err);
      }
    },
    [
      dexProgramId,
      network.name,
      program,
      pushErrorNotification,
      pushNotification,
    ],
  );
};
