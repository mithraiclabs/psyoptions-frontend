import { useCallback } from 'react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { exerciseCoveredCall } from '@mithraic-labs/psyoptions';
import BN from 'bn.js';
import {
  PSY_AMERICAN_PROGRAM_IDS,
  ProgramVersions,
  instructions,
} from '@mithraic-labs/psy-american';

import useConnection from './useConnection';
import useWallet from './useWallet';
import useNotifications from './useNotifications';
import useSendTransaction from './useSendTransaction';
import { OptionMarket } from '../types';
import { createAssociatedTokenAccountInstruction } from '../utils/instructions';
import useOwnedTokenAccounts from './useOwnedTokenAccounts';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';
import { uiOptionMarketToProtocolOptionMarket } from '../utils/typeConversions';

// TODO add support for wrapped solana as quote asset???
const useExerciseOpenPosition = (
  market: OptionMarket,
  exerciserQuoteAssetKey: PublicKey | null,
  exerciserUnderlyingAssetKey: PublicKey | null,
  exerciserContractTokenKey: PublicKey | null,
): ((size: number) => Promise<void>) => {
  const program = useAmericanPsyOptionsProgram();
  const { subscribeToTokenAccount } = useOwnedTokenAccounts();
  const { pushErrorNotification } = useNotifications();
  const { connection } = useConnection();
  const { sendTransaction } = useSendTransaction();
  const { wallet, pubKey } = useWallet();

  return useCallback(
    async (size) => {
      try {
        const transaction = new Transaction();

        let _exerciserUnderlyingAssetKey = exerciserUnderlyingAssetKey;
        if (!_exerciserUnderlyingAssetKey) {
          // Create a SPL Token account for this base account if the wallet doesn't have one
          const [createOptAccountTx, newTokenAccountKey] =
            await createAssociatedTokenAccountInstruction({
              payer: pubKey,
              owner: pubKey,
              mintPublicKey: market.underlyingAssetMintKey,
            });
          transaction.add(createOptAccountTx);
          subscribeToTokenAccount(newTokenAccountKey);
          _exerciserUnderlyingAssetKey = newTokenAccountKey;
        }

        let exerciseTx: Transaction;
        if (
          PSY_AMERICAN_PROGRAM_IDS[market.psyOptionsProgramId.toString()] ===
          ProgramVersions.V1
        ) {
          ({ transaction: exerciseTx } = await exerciseCoveredCall({
            connection,
            payerKey: pubKey,
            programId: market.psyOptionsProgramId,
            optionMintKey: market.optionMintKey,
            optionMarketKey: market.optionMarketKey,
            exerciserQuoteAssetKey,
            exerciserUnderlyingAssetKey: _exerciserUnderlyingAssetKey,
            exerciserQuoteAssetAuthorityKey: pubKey,
            underlyingAssetPoolKey: market.underlyingAssetPoolKey,
            quoteAssetPoolKey: market.quoteAssetPoolKey,
            optionTokenKey: exerciserContractTokenKey,
            optionTokenAuthorityKey: pubKey,
            quoteAssetMintKey: market.quoteAssetMintKey,
            size: new BN(size),
          }));
        } else {
          const ix = await instructions.exerciseOptionsInstruction(
            program,
            new BN(size),
            uiOptionMarketToProtocolOptionMarket(market),
            exerciserContractTokenKey,
            _exerciserUnderlyingAssetKey,
            exerciserQuoteAssetKey,
          );
          exerciseTx = new Transaction().add(ix);
        }

        transaction.add(exerciseTx);

        // TODO add the Asset Pair to the push note messages
        await sendTransaction({
          transaction,
          wallet,
          connection,
          sendingMessage: 'Processing: Exercise Option',
          successMessage: 'Confirmed: Exercise Option',
        });
      } catch (err) {
        pushErrorNotification(err);
      }
      return null;
    },
    [
      connection,
      pubKey,
      market,
      exerciserQuoteAssetKey,
      exerciserUnderlyingAssetKey,
      exerciserContractTokenKey,
      program,
      wallet,
      pushErrorNotification,
      sendTransaction,
      subscribeToTokenAccount,
    ],
  );
};

export default useExerciseOpenPosition;
