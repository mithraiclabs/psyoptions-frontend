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
import { useConnectedWallet } from '@saberhq/use-solana';
import useSendTransaction from '../useSendTransaction';
import { useAmericanPsyOptionsProgram } from '../useAmericanPsyOptionsProgram';
import { OptionMarket } from '../../types';
import { getReferralId } from '../../utils/networkInfo';
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext';

/**
 * Returns function for settling the funds of a specific market
 */
export const useSettleFunds = (
  serumMarketAddress: string,
  optionMarket: OptionMarket | undefined,
  optionKey: PublicKey | undefined,
): {
  makeSettleFundsTx: () => Promise<Transaction | undefined>;
  settleFunds: () => Promise<void>;
} => {
  const program = useAmericanPsyOptionsProgram();
  const { pushErrorNotification } = useNotifications();
  const { connection, dexProgramId, endpoint } = useConnection();
  const { serumMarkets } = useSerum();
  const wallet = useConnectedWallet();
  const { sendTransaction } = useSendTransaction();
  const { ownedTokenAccounts, subscribeToTokenAccount } =
    useOwnedTokenAccounts();
  const { openOrdersBySerumMarket } = useSerumOpenOrders();
  const openOrders = openOrdersBySerumMarket[serumMarketAddress];
  const serumMarket = serumMarkets[serumMarketAddress]?.serumMarket;
  const baseMintAddress =
    serumMarket?.baseMintAddress && serumMarket.baseMintAddress.toString();
  const quoteMintAddress =
    serumMarket?.quoteMintAddress && serumMarket.quoteMintAddress.toString();
  const baseTokenAccounts = ownedTokenAccounts[baseMintAddress ?? ''] ?? [];
  const quoteTokenAccounts = ownedTokenAccounts[quoteMintAddress ?? ''] ?? [];
  const highestBaseTokenAccount = getHighestAccount(baseTokenAccounts);
  const highestQuoteTokenAccount = getHighestAccount(quoteTokenAccounts);

  const makeSettleFundsTx = useCallback(async (): Promise<
    Transaction | undefined
  > => {
    if (!openOrders?.length || !serumMarket || !wallet?.publicKey || !program) {
      return;
    }

    const transaction = new Transaction();
    let signers: Signer[] = [];
    let _baseTokenAccountKey = highestBaseTokenAccount?.pubKey;
    let _quoteTokenAccountKey = highestQuoteTokenAccount?.pubKey;

    if (!_baseTokenAccountKey) {
      // Create a SPL Token account for this base account if the wallet doesn't have one
      const [createOptAccountTx, newTokenAccountKey] =
        await createAssociatedTokenAccountInstruction({
          payer: wallet.publicKey,
          owner: wallet.publicKey,
          mintPublicKey: serumMarket?.baseMintAddress,
        });

      transaction.add(createOptAccountTx);
      _baseTokenAccountKey = newTokenAccountKey;
      subscribeToTokenAccount(newTokenAccountKey);
    }

    if (!_quoteTokenAccountKey) {
      // Create a SPL Token account for this quote account if the wallet doesn't have one
      const [createOptAccountTx, newTokenAccountKey] =
        await createAssociatedTokenAccountInstruction({
          payer: wallet.publicKey,
          owner: wallet.publicKey,
          mintPublicKey: serumMarket.quoteMintAddress,
        });

      transaction.add(createOptAccountTx);
      _quoteTokenAccountKey = newTokenAccountKey;
      subscribeToTokenAccount(newTokenAccountKey);
    }

    let settleTx: Transaction;
    let settleSigners: Signer[] = [];
    if (
      PSY_AMERICAN_PROGRAM_IDS[
        optionMarket?.psyOptionsProgramId?.toString() ?? ''
      ] === ProgramVersions.V1
    ) {
      ({ transaction: settleTx, signers: settleSigners } =
        await serumMarket.makeSettleFundsTransaction(
          connection,
          openOrders[0],
          _baseTokenAccountKey,
          _quoteTokenAccountKey,
          await getReferralId(program, endpoint, serumMarket.quoteMintAddress),
        ));
    } else {
      if (!optionKey || !dexProgramId) {
        return;
      }
      const ix = await serumInstructions.settleFundsInstruction(
        program,
        optionKey,
        dexProgramId,
        serumMarket.address,
        _baseTokenAccountKey,
        _quoteTokenAccountKey,
        await getReferralId(program, endpoint, serumMarket.quoteMintAddress),
        openOrders[0].address,
        undefined,
      );
      settleTx = new Transaction().add(ix);
    }
    transaction.add(settleTx);
    signers = [...signers, ...settleSigners];

    transaction.feePayer = wallet.publicKey;
    const { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;

    if (signers.length) {
      transaction.partialSign(...signers);
    }
    return transaction;
  }, [
    openOrders,
    serumMarket,
    wallet?.publicKey,
    program,
    highestBaseTokenAccount?.pubKey,
    highestQuoteTokenAccount?.pubKey,
    optionMarket?.psyOptionsProgramId,
    connection,
    subscribeToTokenAccount,
    endpoint,
    optionKey,
    dexProgramId,
  ]);

  const settleFunds = useCallback(async () => {
    if (!wallet) {
      return;
    }
    try {
      const transaction = await makeSettleFundsTx();
      if (!transaction) {
        return;
      }
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
