import { useCallback } from 'react';
import { PublicKey, Transaction } from '@solana/web3.js';

import { Market, OrderParams } from '@mithraic-labs/serum/lib/market';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Asset, OptionMarket, TokenAccount } from '../types';
import { WRAPPED_SOL_ADDRESS } from '../utils/token';
import useNotifications from './useNotifications';
import useSendTransaction from './useSendTransaction';
import useOwnedTokenAccounts from './useOwnedTokenAccounts';
import { useSolanaMeta } from '../context/SolanaMetaContext';
import useConnection from './useConnection';
import useWallet from './useWallet';
import { createMissingAccountsAndMint } from '../utils/instructions/index';
import { useCreateAdHocOpenOrdersSubscription } from './Serum';

type PlaceSellOrderArgs = {
  numberOfContractsToMint: number;
  serumMarket: Market;
  orderArgs: OrderParams<PublicKey>;
  optionMarket: OptionMarket;
  uAsset: Asset;
  uAssetTokenAccount: TokenAccount;
  mintedOptionDestinationKey?: PublicKey;
  writerTokenDestinationKey?: PublicKey;
};

const usePlaceSellOrder = (
  serumMarketAddress: string,
): ((obj: PlaceSellOrderArgs) => Promise<void>) => {
  const { pushErrorNotification } = useNotifications();
  const { wallet, pubKey } = useWallet();
  const { connection } = useConnection();
  const { splTokenAccountRentBalance } = useSolanaMeta();
  const { subscribeToTokenAccount } = useOwnedTokenAccounts();
  const { sendSignedTransaction } = useSendTransaction();
  const createAdHocOpenOrdersSub =
    useCreateAdHocOpenOrdersSubscription(serumMarketAddress);

  return useCallback(
    async ({
      numberOfContractsToMint,
      serumMarket,
      orderArgs,
      optionMarket,
      uAsset,
      uAssetTokenAccount,
      mintedOptionDestinationKey,
      writerTokenDestinationKey,
    }: PlaceSellOrderArgs) => {
      try {
        const mintTX = new Transaction();
        let mintSigners = [];
        let _uAssetTokenAccount = uAssetTokenAccount;
        let _optionTokenSrcKey = mintedOptionDestinationKey;
        let _writerTokenDestinationKey = writerTokenDestinationKey;

        // Mint and place order
        if (numberOfContractsToMint > 0) {
          // Mint missing contracs before placing order
          const { error, response } = await createMissingAccountsAndMint({
            optionsProgramId: new PublicKey(optionMarket.psyOptionsProgramId),
            authorityPubkey: pubKey,
            owner: pubKey,
            market: optionMarket,
            uAsset,
            uAssetTokenAccount: _uAssetTokenAccount,
            splTokenAccountRentBalance,
            numberOfContractsToMint,
            mintedOptionDestinationKey: _optionTokenSrcKey,
            writerTokenDestinationKey: _writerTokenDestinationKey,
          });
          if (error) {
            // eslint-disable-next-line no-console
            console.error(error);
            pushErrorNotification(error);
            return;
          }
          const {
            transaction: createAndMintTx,
            signers: createAndMintSigners,
            mintedOptionDestinationKey: _mintedOptionDestinationKey,
            writerTokenDestinationKey: __writerTokenDestinationKey,
            uAssetTokenAccount: __uAssetTokenAccount,
          } = response;
          _uAssetTokenAccount = __uAssetTokenAccount;
          subscribeToTokenAccount(__writerTokenDestinationKey);
          subscribeToTokenAccount(_mintedOptionDestinationKey);

          // Add the create accounts and mint instructions to the TX
          mintTX.add(createAndMintTx);
          mintSigners = createAndMintSigners;

          // must overwrite the original payer (aka option src) in case the
          // option(s) were minted to a new Account
          _optionTokenSrcKey = _mintedOptionDestinationKey;
          _writerTokenDestinationKey = __writerTokenDestinationKey;

          // Close out the wrapped SOL account so it feels native
          if (optionMarket.uAssetMint === WRAPPED_SOL_ADDRESS) {
            mintTX.add(
              Token.createCloseAccountInstruction(
                TOKEN_PROGRAM_ID,
                _uAssetTokenAccount.pubKey,
                pubKey, // Send any remaining SOL to the owner
                pubKey,
                [],
              ),
            );
          }
        }

        const {
          openOrdersAddress,
          transaction: placeOrderTx,
          signers: placeOrderSigners,
        } = await serumMarket.makePlaceOrderTransaction(connection, {
          ...orderArgs,
          payer: _optionTokenSrcKey,
        });

        if (openOrdersAddress) {
          createAdHocOpenOrdersSub(openOrdersAddress);
        }

        const { blockhash } = await connection.getRecentBlockhash();

        mintTX.feePayer = pubKey;
        mintTX.recentBlockhash = blockhash;
        if (mintSigners.length) {
          mintTX.partialSign(...mintSigners);
        }
        placeOrderTx.feePayer = pubKey;
        placeOrderTx.recentBlockhash = blockhash;

        if (placeOrderSigners.length) {
          placeOrderTx.partialSign(...placeOrderSigners);
        }

        const signed = await wallet.signAllTransactions([mintTX, placeOrderTx]);

        // send the PsyOptions Mint transaction
        await sendSignedTransaction({
          signedTransaction: signed[0],
          connection,
          sendingMessage: `Processing: Write ${numberOfContractsToMint} contract${
            numberOfContractsToMint > 1 ? 's' : ''
          }`,
          successMessage: `Confirmed: Write ${numberOfContractsToMint} contract${
            numberOfContractsToMint > 1 ? 's' : ''
          }`,
        });

        // send the Serum place order transaction
        await sendSignedTransaction({
          signedTransaction: signed[signed.length - 1],
          connection,
          sendingMessage: `Processing: Sell ${orderArgs.size} contract${
            numberOfContractsToMint > 1 ? 's' : ''
          }`,
          successMessage: `Confirmed: Sell ${orderArgs.size} contract${
            numberOfContractsToMint > 1 ? 's' : ''
          }`,
        });
      } catch (err) {
        pushErrorNotification(err);
      }
    },
    [
      connection,
      createAdHocOpenOrdersSub,
      pubKey,
      pushErrorNotification,
      sendSignedTransaction,
      splTokenAccountRentBalance,
      subscribeToTokenAccount,
      wallet,
    ],
  );
};

export default usePlaceSellOrder;
