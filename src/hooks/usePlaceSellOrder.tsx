import { useCallback } from 'react';
import { PublicKey, Signer, Transaction } from '@solana/web3.js';
import {
  serumUtils,
  PSY_AMERICAN_PROGRAM_IDS,
  ProgramVersions,
  serumInstructions,
  OptionMarketWithKey,
} from '@mithraic-labs/psy-american';
import { Market, OrderParams } from '@mithraic-labs/serum/lib/market';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { CreateMissingMintAccountsRes } from '../types';
import { WRAPPED_SOL_ADDRESS } from '../utils/token';
import useNotifications from './useNotifications';
import useSendTransaction from './useSendTransaction';
import useOwnedTokenAccounts from './useOwnedTokenAccounts';
import { useSolanaMeta } from '../context/SolanaMetaContext';
import useConnection from './useConnection';
import { useConnectedWallet } from '@saberhq/use-solana';
import { createMissingAccountsAndMint } from '../utils/instructions/index';
import { useCreateAdHocOpenOrdersSubscription } from './Serum';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';
import BigNumber from 'bignumber.js';

type PlaceSellOrderArgs = {
  numberOfContractsToMint: number;
  serumMarket: Market;
  orderArgs: OrderParams<PublicKey> & { payer: PublicKey | undefined };
  option: OptionMarketWithKey;
  optionUnderlyingAssetSymbol: string;
  optionUnderlyingDecimals: number;
  optionUnderlyingSize: BigNumber;
  mintedOptionDestinationKey?: PublicKey;
  underlyingAssetAmount: number;
  underlyingAssetSource: PublicKey | undefined;
  writerTokenDestinationKey?: PublicKey;
};

const usePlaceSellOrder = (
  serumMarketAddress: string,
): ((obj: PlaceSellOrderArgs) => Promise<void>) => {
  const program = useAmericanPsyOptionsProgram();
  const { pushErrorNotification } = useNotifications();
  const wallet = useConnectedWallet();
  const { connection, dexProgramId } = useConnection();
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
      option,
      optionUnderlyingAssetSymbol,
      optionUnderlyingDecimals,
      optionUnderlyingSize,
      mintedOptionDestinationKey,
      underlyingAssetAmount,
      underlyingAssetSource,
      writerTokenDestinationKey,
    }: PlaceSellOrderArgs) => {
      if (
        !connection ||
        !wallet?.publicKey ||
        !program ||
        !dexProgramId ||
        !splTokenAccountRentBalance
      ) {
        return;
      }
      try {
        const mintTX = new Transaction();
        let mintSigners: Signer[] = [];
        let _optionTokenSrcKey = mintedOptionDestinationKey;
        let _writerTokenDestinationKey = writerTokenDestinationKey;
        let _underlyingAssetSource = underlyingAssetSource;

        // Mint and place order
        if (numberOfContractsToMint > 0) {
          // Mint missing contracs before placing order
          const { error, response } = await createMissingAccountsAndMint({
            optionsProgramId: program.programId,
            authorityPubkey: wallet.publicKey,
            owner: wallet.publicKey,
            option,
            optionUnderlyingAssetSymbol,
            optionUnderlyingDecimals,
            optionUnderlyingSize,
            splTokenAccountRentBalance,
            numberOfContractsToMint,
            mintedOptionDestinationKey: _optionTokenSrcKey,
            underlyingAssetAmount,
            underlyingAssetSource,
            writerTokenDestinationKey: _writerTokenDestinationKey,
            program,
          });
          if (error) {
            console.error(error);
            pushErrorNotification(error.message);
            return;
          }
          const {
            transaction: createAndMintTx,
            signers: createAndMintSigners,
            mintedOptionDestinationKey: _mintedOptionDestinationKey,
            writerTokenDestinationKey: __writerTokenDestinationKey,
            underlyingAssetSource: __underlyingAssetSource,
          } = response as CreateMissingMintAccountsRes;
          _underlyingAssetSource = __underlyingAssetSource;
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
          if (option.underlyingAssetMint.toString() === WRAPPED_SOL_ADDRESS) {
            mintTX.add(
              Token.createCloseAccountInstruction(
                TOKEN_PROGRAM_ID,
                _underlyingAssetSource,
                wallet.publicKey, // Send any remaining SOL to the owner
                wallet.publicKey,
                [],
              ),
            );
          }
        }

        if (!_optionTokenSrcKey) {
          return;
        }

        /// /////////////////// CREATE SERUM TRANSACTION /////////////////////////
        // Backwards compatability for V1
        let placeOrderTx: Transaction;
        let placeOrderSigners: Signer[] = [];
        let openOrdersAddress: PublicKey;
        // eslint-disable-next-line
        if (
          PSY_AMERICAN_PROGRAM_IDS[program.programId.toString()] ===
          ProgramVersions.V1
        ) {
          ({
            openOrdersAddress,
            transaction: placeOrderTx,
            signers: placeOrderSigners,
          } = await serumMarket.makePlaceOrderTransaction(connection, {
            ...orderArgs,
            payer: _optionTokenSrcKey,
          }));
        } else {
          const [serumMarketKey] = await serumUtils.deriveSerumMarketAddress(
            program,
            option.key,
          );
          const { openOrdersKey, tx } =
            await serumInstructions.newOrderInstruction(
              program,
              option.key,
              dexProgramId,
              serumMarketKey,
              { ...orderArgs, payer: _optionTokenSrcKey },
            );
          placeOrderTx = new Transaction().add(tx);
          openOrdersAddress = openOrdersKey;
        }

        if (openOrdersAddress) {
          createAdHocOpenOrdersSub(openOrdersAddress);
        }

        const { blockhash } = await connection.getRecentBlockhash();
        const transactions: Transaction[] = [];
        if (mintTX.instructions.length > 0) {
          mintTX.feePayer = wallet.publicKey;
          mintTX.recentBlockhash = blockhash;
          if (mintSigners.length) {
            mintTX.partialSign(...mintSigners);
          }
          transactions.push(mintTX);
        }
        placeOrderTx.feePayer = wallet.publicKey;
        placeOrderTx.recentBlockhash = blockhash;

        if (placeOrderSigners.length) {
          placeOrderTx.partialSign(...placeOrderSigners);
        }
        transactions.push(placeOrderTx);

        const signed = await wallet.signAllTransactions(transactions);
        if (mintTX.instructions.length > 0) {
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
        }

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
      dexProgramId,
      program,
      pushErrorNotification,
      sendSignedTransaction,
      splTokenAccountRentBalance,
      subscribeToTokenAccount,
      wallet,
    ],
  );
};

export default usePlaceSellOrder;
