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
import { useConnectedWallet } from "@saberhq/use-solana";
import useNotifications from './useNotifications';
import useSendTransaction from './useSendTransaction';
import { OptionMarket } from '../types';
import { initializeTokenAccountTx, WRAPPED_SOL_ADDRESS } from '../utils/token';
import { useSolanaMeta } from '../context/SolanaMetaContext';
import { createAssociatedTokenAccountInstruction } from '../utils/instructions';
import useOwnedTokenAccounts from './useOwnedTokenAccounts';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';
import { uiOptionMarketToProtocolOptionMarket } from '../utils/typeConversions';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';

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
  const { sendSignedTransaction } = useSendTransaction();
  const wallet = useConnectedWallet();
  const { splTokenAccountRentBalance } = useSolanaMeta();

  return useCallback(async (size) => {
    if (!wallet?.publicKey)
      return;
    try {
      const transaction = new Transaction();
      const signers = [];
      let _exerciserUnderlyingAssetKey = exerciserUnderlyingAssetKey;
      if (market.uAssetMint === WRAPPED_SOL_ADDRESS) {
        // need to create a sol account
        const {
          transaction: initWrappedSolAcctIx,
          newTokenAccount: wrappedSolAccount,
        } = await initializeTokenAccountTx({
          // eslint-disable-line
          connection,
          payerKey: wallet.publicKey,
          mintPublicKey: new PublicKey(WRAPPED_SOL_ADDRESS),
          owner: wallet.publicKey,
          rentBalance: splTokenAccountRentBalance,
        });
        transaction.add(initWrappedSolAcctIx);
        signers.push(wrappedSolAccount);
        _exerciserUnderlyingAssetKey = wrappedSolAccount.publicKey;
      } else if (!_exerciserUnderlyingAssetKey) {
        // Create a SPL Token account for this base account if the wallet doesn't have one
        const [createOptAccountTx, newTokenAccountKey] =
          await createAssociatedTokenAccountInstruction({
            payer: wallet.publicKey,
            owner: wallet.publicKey,
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
          payerKey: wallet.publicKey,
          programId: market.psyOptionsProgramId,
          optionMintKey: market.optionMintKey,
          optionMarketKey: market.optionMarketKey,
          exerciserQuoteAssetKey,
          exerciserUnderlyingAssetKey: _exerciserUnderlyingAssetKey,
          exerciserQuoteAssetAuthorityKey: wallet.publicKey,
          underlyingAssetPoolKey: market.underlyingAssetPoolKey,
          quoteAssetPoolKey: market.quoteAssetPoolKey,
          optionTokenKey: exerciserContractTokenKey,
          optionTokenAuthorityKey: wallet.publicKey,
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

      if (market.uAssetMint === WRAPPED_SOL_ADDRESS) {
        transaction.add(
          Token.createCloseAccountInstruction(
            TOKEN_PROGRAM_ID,
            _exerciserUnderlyingAssetKey,
            wallet.publicKey, // Send any remaining SOL to the owner
            wallet.publicKey,
            [],
          ),
        );
      }
      transaction.feePayer = wallet.publicKey;
      const { blockhash } = await connection.getRecentBlockhash(); // eslint-disable-line
      transaction.recentBlockhash = blockhash;

      if (signers.length) {
        transaction.partialSign(...signers);
      }

      const signedTx = await wallet.signTransaction(transaction);

      // TODO add the Asset Pair to the push note messages
      await sendSignedTransaction({
        signedTransaction: signedTx,
        connection,
        sendingMessage: 'Processing: Exercise Option',
        successMessage: 'Confirmed: Exercise Option',
      });
    } catch (err) {
      pushErrorNotification(err);
    }
  }, [
    connection,
    market,
    exerciserQuoteAssetKey,
    exerciserUnderlyingAssetKey,
    exerciserContractTokenKey,
    splTokenAccountRentBalance,
    program,
    wallet,
    pushErrorNotification,
    sendSignedTransaction,
    subscribeToTokenAccount,
  ]);
};

export default useExerciseOpenPosition;
