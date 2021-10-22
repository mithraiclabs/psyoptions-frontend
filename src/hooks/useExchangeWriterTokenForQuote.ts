import { useCallback } from 'react';
import { exchangeWriterTokenForQuoteInstruction } from '@mithraic-labs/psyoptions';
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  PSY_AMERICAN_PROGRAM_IDS,
  ProgramVersions,
  instructions,
} from '@mithraic-labs/psy-american';
import { BN } from '@project-serum/anchor';
import useNotifications from './useNotifications';
import useConnection from './useConnection';
import { useConnectedWallet } from "@saberhq/use-solana";
import useSendTransaction from './useSendTransaction';
import { initializeTokenAccountTx, WRAPPED_SOL_ADDRESS } from '../utils/token';
import { useSolanaMeta } from '../context/SolanaMetaContext';
import { OptionMarket } from '../types';
import { createAssociatedTokenAccountInstruction } from '../utils/instructions';
import useOwnedTokenAccounts from './useOwnedTokenAccounts';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';
import { uiOptionMarketToProtocolOptionMarket } from '../utils/typeConversions';

const DEFAULT_SIZE = new BN(1);

/**
 * Allow user to burn a Writer Token in exchange for Quote Asset in the
 * Quote Asset Pool
 *
 * @param market
 * @param writerTokenSourceKey
 * @param quoteAssetDestKey
 * @returns
 */
export const useExchangeWriterTokenForQuote = (
  market: OptionMarket,
  writerTokenSourceKey: PublicKey,
  quoteAssetDestKey: PublicKey,
): ((size?: BN) => Promise<void>) => {
  const program = useAmericanPsyOptionsProgram();
  const { subscribeToTokenAccount } = useOwnedTokenAccounts();
  const { connection } = useConnection();
  const wallet = useConnectedWallet();
  const { splTokenAccountRentBalance } = useSolanaMeta();
  const { pushErrorNotification } = useNotifications();
  const { sendTransaction } = useSendTransaction();

  return useCallback(async (size = DEFAULT_SIZE) => {
    if (!wallet?.publicKey)
      return;
    
    try {
      const transaction = new Transaction();
      const signers = [];
      let _quoteAssetDestKey = quoteAssetDestKey;

      if (market.quoteAssetMintKey.toString() === WRAPPED_SOL_ADDRESS) {
        // quote is wrapped sol, must create account to transfer and close
        const {
          transaction: initWrappedSolAcctIx,
          newTokenAccount: wrappedSolAccount,
        } = await initializeTokenAccountTx({
          connection,
          payerKey: wallet.publicKey,
          mintPublicKey: new PublicKey(WRAPPED_SOL_ADDRESS),
          owner: wallet.publicKey,
          rentBalance: splTokenAccountRentBalance,
        });
        transaction.add(initWrappedSolAcctIx);
        signers.push(wrappedSolAccount);
        _quoteAssetDestKey = wrappedSolAccount.publicKey;
      }
      if (!_quoteAssetDestKey) {
        // Create a SPL Token account for this base account if the wallet doesn't have one
        const [createOptAccountTx, newTokenAccountKey] =
          await createAssociatedTokenAccountInstruction({
            payer: wallet.publicKey,
            owner: wallet.publicKey,
            mintPublicKey: market.quoteAssetMintKey,
          });
        transaction.add(createOptAccountTx);
        subscribeToTokenAccount(newTokenAccountKey);
        _quoteAssetDestKey = newTokenAccountKey;
      }

      let burnWriterForQuoteIx: TransactionInstruction;
      if (
        PSY_AMERICAN_PROGRAM_IDS[market.psyOptionsProgramId.toString()] ===
        ProgramVersions.V1
      ) {
        burnWriterForQuoteIx = await exchangeWriterTokenForQuoteInstruction({
          programId: new PublicKey(market.psyOptionsProgramId),
          optionMarketKey: market.optionMarketKey,
          writerTokenMintKey: market.writerTokenMintKey,
          writerTokenSourceAuthorityKey: wallet.publicKey,
          quoteAssetPoolKey: market.quoteAssetPoolKey,
          writerTokenSourceKey,
          quoteAssetDestKey: _quoteAssetDestKey,
          size,
        });
      } else {
        burnWriterForQuoteIx = instructions.burnWriterForQuote(
          program,
          size,
          uiOptionMarketToProtocolOptionMarket(market),
          writerTokenSourceKey,
          _quoteAssetDestKey,
        );
      }
      transaction.add(burnWriterForQuoteIx);

      // Close out the wrapped SOL account so it feels native
      if (market.quoteAssetMintKey.toString() === WRAPPED_SOL_ADDRESS) {
        transaction.add(
          Token.createCloseAccountInstruction(
            TOKEN_PROGRAM_ID,
            _quoteAssetDestKey,
            wallet.publicKey, // Send any remaining SOL to the owner
            wallet.publicKey,
            [],
          ),
        );
      }

      await sendTransaction({
        transaction,
        wallet,
        signers,
        connection,
        sendingMessage: 'Sending: Burn Writer Token for quote assets',
        successMessage: 'Confirmed: Burn Writer Token for quote assets',
      });
    } catch (err) {
      pushErrorNotification(err);
    }
  }, [
    quoteAssetDestKey,
    market,
    program,
    writerTokenSourceKey,
    connection,
    wallet,
    subscribeToTokenAccount,
    pushErrorNotification,
    sendTransaction,
    splTokenAccountRentBalance,
  ]);
};
