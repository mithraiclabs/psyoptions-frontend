import {
  ProgramVersions,
  PSY_AMERICAN_PROGRAM_IDS,
  serumInstructions,
} from '@mithraic-labs/psy-american';
import { OpenOrders } from '@project-serum/serum';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { activeNetwork } from '../../recoil';
import { getSupportedMarketsByNetwork } from '../../utils/networkInfo';
import { useAmericanPsyOptionsProgram } from '../useAmericanPsyOptionsProgram';
import useConnection from '../useConnection';

export const useCloseOpenOrders = () => {
  const program = useAmericanPsyOptionsProgram();
  const { dexProgramId } = useConnection();
  const network = useRecoilValue(activeNetwork);

  // await serumInstructions.closeOpenOrdersInstruction();
  return useCallback(
    async (optionKey: PublicKey, openOrders: OpenOrders) => {
      if (!program || !dexProgramId) {
        return;
      }
      const closeOpenOrdersTransaction = new Transaction();
      // TODO handle legacy markets
      const marketMetas = getSupportedMarketsByNetwork(network.name);
      const optionMarketMeta = marketMetas.find(
        (omm) => omm.optionMarketAddress === optionKey.toString(),
      );
      if (
        optionMarketMeta &&
        PSY_AMERICAN_PROGRAM_IDS[
          optionMarketMeta.psyOptionsProgramId.toString()
        ] === ProgramVersions.V1
      ) {
        // TODO handle
      } else {
        const ix = await serumInstructions.closeOpenOrdersInstruction(
          program,
          optionKey,
          dexProgramId,
          openOrders.address,
          openOrders.market,
          undefined,
        );
        closeOpenOrdersTransaction.add(ix);
      }
      program.provider.send(closeOpenOrdersTransaction);
      // const { blockhash } =
      //   await program.provider.connection.getRecentBlockhash();
      // tx.recentBlockhash = blockhash;
      // tx.feePayer = program.provider.wallet.publicKey;
    },
    [dexProgramId, network.name, program],
  );
};
