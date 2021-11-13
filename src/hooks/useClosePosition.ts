import { useCallback } from 'react';
import { closePositionInstruction } from '@mithraic-labs/psyoptions';
import {
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';
import {
  PSY_AMERICAN_PROGRAM_IDS,
  ProgramVersions,
  instructions,
} from '@mithraic-labs/psy-american';
import { BN } from 'bn.js';
import useConnection from './useConnection';
import { useConnectedWallet } from '@saberhq/use-solana';
import useNotifications from './useNotifications';
import useSendTransaction from './useSendTransaction';
import { initializeTokenAccountTx, WRAPPED_SOL_ADDRESS } from '../utils/token';
import { useSolanaMeta } from '../context/SolanaMetaContext';
import { OptionMarket } from '../types';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';
import { uiOptionMarketToProtocolOptionMarket } from '../utils/typeConversions';

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
  const program = useAmericanPsyOptionsProgram();
  const { connection } = useConnection();
  const { pushErrorNotification } = useNotifications();
  const wallet = useConnectedWallet();
  const { splTokenAccountRentBalance } = useSolanaMeta();
  const { sendSignedTransaction } = useSendTransaction();

  return useCallback(
    async (contractsToClose = 1) => {
      if (
        !wallet ||
        !wallet?.publicKey ||
        !splTokenAccountRentBalance ||
        !program
      )
        return;

      try {
        const tx = new Transaction();
        const signers: Signer[] = [];
        let _underlyingAssetDestKey = underlyingAssetDestKey;
        if (market.uAssetMint === WRAPPED_SOL_ADDRESS) {
          // need to create a sol account
          const { transaction, newTokenAccount: wrappedSolAccount } =
            await initializeTokenAccountTx({
              connection,
              payerKey: wallet.publicKey,
              mintPublicKey: new PublicKey(WRAPPED_SOL_ADDRESS),
              owner: wallet.publicKey,
              rentBalance: splTokenAccountRentBalance,
            });
          tx.add(transaction);
          signers.push(wrappedSolAccount);
          _underlyingAssetDestKey = wrappedSolAccount.publicKey;
        }

        let closePositionIx: TransactionInstruction;
        if (
          PSY_AMERICAN_PROGRAM_IDS[market.psyOptionsProgramId.toString()] ===
          ProgramVersions.V1
        ) {
          closePositionIx = await closePositionInstruction({
            programId: new PublicKey(market.psyOptionsProgramId),
            optionMarketKey: market.optionMarketKey,
            underlyingAssetPoolKey: market.underlyingAssetPoolKey,
            optionMintKey: market.optionMintKey,
            optionTokenSrcKey,
            optionTokenSrcAuthKey: wallet.publicKey,
            size: new BN(contractsToClose),
            writerTokenMintKey: market.writerTokenMintKey,
            writerTokenSourceKey,
            writerTokenSourceAuthorityKey: wallet.publicKey,
            underlyingAssetDestKey: _underlyingAssetDestKey,
          });
        } else {
          closePositionIx = instructions.closePositionInstruction(
            program,
            new BN(contractsToClose),
            uiOptionMarketToProtocolOptionMarket(market),
            writerTokenSourceKey,
            optionTokenSrcKey,
            _underlyingAssetDestKey,
          );
        }

        tx.add(closePositionIx);
        // Close out the wrapped SOL account so it feels native
        if (market.uAssetMint === WRAPPED_SOL_ADDRESS) {
          tx.add(
            Token.createCloseAccountInstruction(
              TOKEN_PROGRAM_ID,
              _underlyingAssetDestKey,
              wallet.publicKey, // Send any remaining SOL to the owner
              wallet.publicKey,
              [],
            ),
          );
        }

        tx.feePayer = wallet.publicKey;
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
      market,
      optionTokenSrcKey,
      writerTokenSourceKey,
      connection,
      sendSignedTransaction,
      program,
      wallet,
      pushErrorNotification,
      splTokenAccountRentBalance,
    ],
  );
};
