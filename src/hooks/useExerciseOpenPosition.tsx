import { useCallback } from 'react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { exerciseCoveredCall } from '@mithraic-labs/psyoptions';
import useConnection from './useConnection';
import useWallet from './useWallet';
import useNotifications from './useNotifications';
import useSendTransaction from './useSendTransaction';
import { OptionMarket } from '../types';
import { createAssociatedTokenAccountInstruction } from '../utils/instructions';
import useOwnedTokenAccounts from './useOwnedTokenAccounts';

const useExerciseOpenPosition = (
  market: OptionMarket,
  exerciserQuoteAssetKey: PublicKey | null,
  exerciserUnderlyingAssetKey: PublicKey | null,
  exerciserContractTokenKey: PublicKey | null,
) => {
  const { subscribeToTokenAccount } = useOwnedTokenAccounts();
  const { pushErrorNotification } = useNotifications();
  const { connection, endpoint } = useConnection();
  const { sendTransaction } = useSendTransaction();
  const { wallet, pubKey } = useWallet();

  const exercise = useCallback(async () => {
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

      const { transaction: tx } = await exerciseCoveredCall({
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
      });
      transaction.add(tx);

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
  }, [
    connection,
    pubKey,
    market,
    exerciserQuoteAssetKey,
    exerciserUnderlyingAssetKey,
    exerciserContractTokenKey,
    wallet,
    pushErrorNotification,
    sendTransaction,
    subscribeToTokenAccount,
  ]);

  return {
    exercise,
  };
};

export default useExerciseOpenPosition;
