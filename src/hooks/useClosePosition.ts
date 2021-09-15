import { useCallback } from 'react';
import { closePositionInstruction } from '@mithraic-labs/psyoptions';
import { PublicKey, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';
import { BN } from 'bn.js';
import useConnection from './useConnection';
import useWallet from './useWallet';
import useNotifications from './useNotifications';
import useSendTransaction from './useSendTransaction';
import { initializeTokenAccountTx, WRAPPED_SOL_ADDRESS } from '../utils/token';
import { useSolanaMeta } from '../context/SolanaMetaContext';
import { OptionMarket } from '../types';

/**
 * Close the Option the wallet has written in order to return the
 * underlying asset to the option writer
 *
 * @param market Market for the option to be closed
 * @param optionTokenSrcKey PublicKey where the Option Token will be burned from
 * @param underlyingAssetDestKEy PublicKey where the unlocked underlying asset will be sent
 * @param writerTokenSourceKey PublicKey of the address where the Writer Token will be burned from
 */

export const useClosePosition = (
  market: OptionMarket,
  optionTokenSrcKey: PublicKey,
  underlyingAssetDestKey: PublicKey,
  writerTokenSourceKey: PublicKey,
): ((num?: number) => Promise<void>) => {
  const { connection } = useConnection();
  const { pushErrorNotification } = useNotifications();
  const { pubKey, wallet } = useWallet();
  const { splTokenAccountRentBalance } = useSolanaMeta();
  const { sendSignedTransaction } = useSendTransaction();

  return useCallback(
    async (contractsToClose = 1) => {
      try {
        const tx = new Transaction();
        const signers = [];
        let _underlyingAssetDestKey = underlyingAssetDestKey;
        if (market.uAssetMint === WRAPPED_SOL_ADDRESS) {
          // need to create a sol account
          const { transaction, newTokenAccount: wrappedSolAccount } =
            await initializeTokenAccountTx({
              connection,
              payerKey: pubKey,
              mintPublicKey: new PublicKey(WRAPPED_SOL_ADDRESS),
              owner: pubKey,
              rentBalance: splTokenAccountRentBalance,
            });
          tx.add(transaction);
          signers.push(wrappedSolAccount);
          _underlyingAssetDestKey = wrappedSolAccount.publicKey;
        }

        const closePositionIx = await closePositionInstruction({
          programId: new PublicKey(market.psyOptionsProgramId),
          optionMarketKey: market.optionMarketKey,
          underlyingAssetPoolKey: market.underlyingAssetPoolKey,
          optionMintKey: market.optionMintKey,
          optionTokenSrcKey,
          optionTokenSrcAuthKey: pubKey,
          size: new BN(contractsToClose),
          writerTokenMintKey: market.writerTokenMintKey,
          writerTokenSourceKey,
          writerTokenSourceAuthorityKey: pubKey,
          underlyingAssetDestKey: _underlyingAssetDestKey,
        });
        tx.add(closePositionIx);
        // Close out the wrapped SOL account so it feels native
        if (market.uAssetMint === WRAPPED_SOL_ADDRESS) {
          tx.add(
            Token.createCloseAccountInstruction(
              TOKEN_PROGRAM_ID,
              _underlyingAssetDestKey,
              pubKey, // Send any remaining SOL to the owner
              pubKey,
              [],
            ),
          );
        }

        tx.feePayer = pubKey;
        const { blockhash } = await connection.getRecentBlockhash(); // eslint-disable-line
        tx.recentBlockhash = blockhash;

        if (signers.length) {
          tx.partialSign(...signers);
        }

        // const signed = await wallet.signAllTransactions(closeTxs);
        const signedTx = await wallet.signTransaction(tx);
        await sendSignedTransaction({
          signedTransaction: signedTx,
          connection,
          sendingMessage: 'Sending: Close Position',
          successMessage: 'Confirmed: Close Position',
        });
      } catch (err) {
        pushErrorNotification(err);
      }
    },
    [
      underlyingAssetDestKey,
      market.uAssetMint,
      market.optionMarketKey,
      market.underlyingAssetPoolKey,
      market.optionMintKey,
      market.writerTokenMintKey,
      market.psyOptionsProgramId,
      optionTokenSrcKey,
      pubKey,
      writerTokenSourceKey,
      connection,
      sendSignedTransaction,
      wallet,
      pushErrorNotification,
      splTokenAccountRentBalance,
    ],
  );
};
