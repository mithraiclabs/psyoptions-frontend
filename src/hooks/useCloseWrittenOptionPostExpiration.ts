import { useCallback, useMemo } from 'react';
import {
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { closePostExpirationCoveredCallInstruction } from '@mithraic-labs/psyoptions';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import {
  PSY_AMERICAN_PROGRAM_IDS,
  ProgramVersions,
  instructions,
} from '@mithraic-labs/psy-american';

import useConnection from './useConnection';
import { useConnectedWallet } from '@saberhq/use-solana';
import useNotifications from './useNotifications';
import useSendTransaction from './useSendTransaction';
import { initializeTokenAccountTx, WRAPPED_SOL_ADDRESS } from '../utils/token';
import { useSolanaMeta } from '../context/SolanaMetaContext';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';
import { useRecoilValue } from 'recoil';
import { optionsMap } from '../recoil';
import useOptionsMarkets from './useOptionsMarkets';

/**
 * Close the Option the wallet has written in order to return the
 * underlying asset to the option writer
 *
 * @param market Market for the option to be closed
 * @param underlyingAssetDestKEy PublicKey where the unlocked underlying asset will be sent
 * @param writerTokenSourceKey PublicKey of the address where the Writer Token will be burned from
 */

export const useCloseWrittenOptionPostExpiration = (
  optionKey: PublicKey,
  underlyingAssetDestKey: PublicKey | null,
  writerTokenSourceKey: PublicKey,
): ((num?: number) => Promise<void>) => {
  const option = useRecoilValue(optionsMap(optionKey.toString()));
  const program = useAmericanPsyOptionsProgram();
  const { connection } = useConnection();
  const { pushErrorNotification } = useNotifications();
  const wallet = useConnectedWallet();
  const { splTokenAccountRentBalance } = useSolanaMeta();
  const { sendSignedTransaction } = useSendTransaction();
  // TODO get rid of the usage of `market`
  const { marketsByUiKey } = useOptionsMarkets();
  const market = useMemo(
    () =>
      Object.values(marketsByUiKey).find((_market) =>
        _market.optionMarketKey.equals(optionKey),
      ),
    [marketsByUiKey, optionKey],
  );

  return useCallback(
    async (contractsToClose = 1) => {
      if (
        !wallet?.publicKey ||
        !splTokenAccountRentBalance ||
        !program ||
        !option
      ) {
        return;
      }
      try {
        const transaction = new Transaction();
        const signers: Signer[] = [];
        let _underlyingAssetDestKey = underlyingAssetDestKey;
        if (option.underlyingAssetMint.toString() === WRAPPED_SOL_ADDRESS) {
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
          _underlyingAssetDestKey = wrappedSolAccount.publicKey;
        }

        if (!_underlyingAssetDestKey) return;

        let closePostExpirationIx: TransactionInstruction;
        if (
          market &&
          PSY_AMERICAN_PROGRAM_IDS[market.psyOptionsProgramId.toString()] ===
            ProgramVersions.V1
        ) {
          closePostExpirationIx =
            await closePostExpirationCoveredCallInstruction({
              programId: new PublicKey(market.psyOptionsProgramId),
              optionMarketKey: market.optionMarketKey,
              size: new BN(contractsToClose),
              underlyingAssetDestKey: _underlyingAssetDestKey,
              underlyingAssetPoolKey: market.underlyingAssetPoolKey,
              writerTokenMintKey: market.writerTokenMintKey,
              writerTokenSourceKey,
              writerTokenSourceAuthorityKey: wallet.publicKey,
            });
        } else {
          closePostExpirationIx = instructions.closePostExpirationInstruction(
            program,
            new BN(contractsToClose),
            option,
            writerTokenSourceKey,
            _underlyingAssetDestKey,
          );
        }

        transaction.add(closePostExpirationIx);

        // Close out the wrapped SOL account so it feels native
        if (option.underlyingAssetMint.toString() === WRAPPED_SOL_ADDRESS) {
          transaction.add(
            Token.createCloseAccountInstruction(
              TOKEN_PROGRAM_ID,
              _underlyingAssetDestKey,
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

        await sendSignedTransaction({
          signedTransaction: signedTx,
          connection,
          sendingMessage: 'Sending Transaction: Close Option',
          successMessage: 'Transaction Confirmed: Close Option',
        });
      } catch (err) {
        pushErrorNotification(err);
      }
    },
    [
      wallet,
      splTokenAccountRentBalance,
      program,
      option,
      underlyingAssetDestKey,
      market,
      connection,
      sendSignedTransaction,
      writerTokenSourceKey,
      pushErrorNotification,
    ],
  );
};
