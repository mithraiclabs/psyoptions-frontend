import { PublicKey, Signer, Transaction } from '@solana/web3.js';
import { useCallback } from 'react';
import {
  PSY_AMERICAN_PROGRAM_IDS,
  ProgramVersions,
  serumInstructions,
} from '@mithraic-labs/psy-american';
import { createAssociatedTokenAccountInstruction } from '../../utils/instructions';
import { getHighestAccount } from '../../utils/token';
import useConnection from '../useConnection';
import useNotifications from '../useNotifications';
import useOwnedTokenAccounts from '../useOwnedTokenAccounts';
import useSerum from '../useSerum';
import useWallet from '../useWallet';
import useSendTransaction from '../useSendTransaction';
import { useSerumOpenOrderAccounts } from './useSerumOpenOrderAccounts';
import useAssetList from '../useAssetList';
import { useAmericanPsyOptionsProgram } from '../useAmericanPsyOptionsProgram';
import { OptionMarket } from '../../types';

/**
 * Returns function for settling the funds of a specific market
 */
export const useSettleFunds = (
  serumMarketAddress: string,
  optionMarket: OptionMarket,
): {
  makeSettleFundsTx: () => Promise<Transaction>;
  settleFunds: () => Promise<void>;
} => {
  const program = useAmericanPsyOptionsProgram();
  const { pushErrorNotification } = useNotifications();
  const { connection, endpoint } = useConnection();
  const { serumMarkets } = useSerum();
  const { wallet, pubKey } = useWallet();
  const { sendTransaction } = useSendTransaction();
  const { USDCPublicKey } = useAssetList();
  const { ownedTokenAccounts, subscribeToTokenAccount } =
    useOwnedTokenAccounts();
  const openOrders = useSerumOpenOrderAccounts(serumMarketAddress, true);
  const serumMarket = serumMarkets[serumMarketAddress]?.serumMarket;
  const baseMintAddress =
    serumMarket?.baseMintAddress && serumMarket.baseMintAddress.toString();
  const quoteMintAddress =
    serumMarket?.quoteMintAddress && serumMarket.quoteMintAddress.toString();
  const baseTokenAccounts = ownedTokenAccounts[baseMintAddress] ?? [];
  const quoteTokenAccounts = ownedTokenAccounts[quoteMintAddress] ?? [];
  const { pubKey: baseTokenAccountKey } = getHighestAccount(baseTokenAccounts);
  const { pubKey: quoteTokenAccountKey } =
    getHighestAccount(quoteTokenAccounts);

  const makeSettleFundsTx = useCallback(async (): Promise<
    Transaction | undefined
  > => {
    if (openOrders.length && serumMarket && optionMarket) {
      const transaction = new Transaction();
      let signers = [];
      let _baseTokenAccountKey = baseTokenAccountKey;
      let _quoteTokenAccountKey = quoteTokenAccountKey;

      if (!_baseTokenAccountKey) {
        // Create a SPL Token account for this base account if the wallet doesn't have one
        const [createOptAccountTx, newTokenAccountKey] =
          await createAssociatedTokenAccountInstruction({
            payer: pubKey,
            owner: pubKey,
            mintPublicKey: serumMarket?.baseMintAddress,
          });

        transaction.add(createOptAccountTx);
        _baseTokenAccountKey = newTokenAccountKey;
        subscribeToTokenAccount(newTokenAccountKey);
      }

      if (!quoteTokenAccountKey) {
        // Create a SPL Token account for this quote account if the wallet doesn't have one
        const [createOptAccountTx, newTokenAccountKey] =
          await createAssociatedTokenAccountInstruction({
            payer: pubKey,
            owner: pubKey,
            mintPublicKey: serumMarket.quoteMintAddress,
          });

        transaction.add(createOptAccountTx);
        _quoteTokenAccountKey = newTokenAccountKey;
        subscribeToTokenAccount(newTokenAccountKey);
      }

      let settleTx: Transaction; let settleSigners: Signer[];
      if (
        PSY_AMERICAN_PROGRAM_IDS[
          optionMarket.psyOptionsProgramId.toString()
        ] === ProgramVersions.V1
      ) {
        ({ transaction: settleTx, signers: settleSigners } =
          await serumMarket.makeSettleFundsTransaction(
            connection,
            openOrders[0],
            _baseTokenAccountKey,
            _quoteTokenAccountKey,
            serumMarket.quoteMintAddress.equals(USDCPublicKey) &&
              endpoint.serumReferrerId
              ? new PublicKey(endpoint.serumReferrerId)
              : undefined,
          ));
      } else {
        const ix = await serumInstructions.settleFundsInstruction(
          program,
          optionMarket.pubkey,
          new PublicKey(optionMarket.serumProgramId),
          serumMarket.address,
          _baseTokenAccountKey,
          _quoteTokenAccountKey,
          new PublicKey(endpoint.serumReferrerId),
          openOrders[0].address,
          undefined,
        );
        settleTx = new Transaction().add(ix);
      }
      transaction.add(settleTx);
      signers = [...signers, ...settleSigners];

      transaction.feePayer = pubKey;
      const { blockhash } = await connection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;

      if (signers.length) {
        transaction.partialSign(...signers);
      }
      return transaction;
    }
    return undefined;
  }, [
    endpoint.serumReferrerId,
    serumMarket,
    openOrders,
    program,
    baseTokenAccountKey,
    quoteTokenAccountKey,
    connection,
    optionMarket,
    USDCPublicKey,
    pubKey,
    subscribeToTokenAccount,
  ]);

  const settleFunds = useCallback(async () => {
    try {
      const transaction = await makeSettleFundsTx();
      await sendTransaction({
        transaction,
        wallet,
        connection,
        sendingMessage: 'Processing: Settle funds',
        successMessage: 'Confirmed: Settle funds',
      });
    } catch (err) {
      pushErrorNotification(err);
    }
  }, [
    connection,
    pushErrorNotification,
    sendTransaction,
    wallet,
    makeSettleFundsTx,
  ]);

  return {
    settleFunds,
    makeSettleFundsTx,
  };
};
