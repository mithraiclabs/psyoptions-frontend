import { PublicKey, Signer, Transaction } from '@solana/web3.js';
import { useCallback } from 'react';
import { Market, OrderParams } from '@project-serum/serum/lib/market';
import {
  PSY_AMERICAN_PROGRAM_IDS,
  ProgramVersions,
  serumInstructions,
} from '@mithraic-labs/psy-american';
import { OptionMarket } from '../types';
import { createAssociatedTokenAccountInstruction } from '../utils/instructions/token';
import { useConnectedWallet } from '@saberhq/use-solana';
import useNotifications from './useNotifications';
import useConnection from './useConnection';
import useSendTransaction from './useSendTransaction';
import useOwnedTokenAccounts from './useOwnedTokenAccounts';
import { useCreateAdHocOpenOrdersSubscription } from './Serum';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';

type PlaceBuyOrderArgs = {
  optionMarket: OptionMarket;
  serumMarket: Market;
  orderArgs: OrderParams<PublicKey>;
  optionDestinationKey?: PublicKey;
};

const usePlaceBuyOrder = (
  serumMarketAddress: string,
): ((obj: PlaceBuyOrderArgs) => Promise<void>) => {
  const program = useAmericanPsyOptionsProgram();
  const { pushErrorNotification } = useNotifications();
  const wallet = useConnectedWallet();
  const { connection } = useConnection();
  const { sendTransaction } = useSendTransaction();
  const { subscribeToTokenAccount } = useOwnedTokenAccounts();
  const createAdHocOpenOrdersSub =
    useCreateAdHocOpenOrdersSubscription(serumMarketAddress);

  return useCallback(
    async ({
      optionMarket,
      serumMarket,
      orderArgs,
      optionDestinationKey,
    }: PlaceBuyOrderArgs) => {
      if (!connection || !wallet?.publicKey) return;

      try {
        const transaction = new Transaction();
        let signers = [];
        const _optionDestinationKey = optionDestinationKey;
        const optionsProgramId = new PublicKey(
          optionMarket.psyOptionsProgramId,
        );

        if (!_optionDestinationKey) {
          // Create a SPL Token account for this option market if the wallet doesn't have one
          const [createOptAccountIx, newPublicKey] =
            await createAssociatedTokenAccountInstruction({
              payer: wallet.publicKey,
              owner: wallet.publicKey,
              mintPublicKey: optionMarket.optionMintKey,
            });

          transaction.add(createOptAccountIx);
          subscribeToTokenAccount(newPublicKey);
        }

        // place the buy order
        let placeOrderTx: Transaction;
        let placeOrderSigners: Signer[] = [];
        let openOrdersAddress: PublicKey;
        if (
          PSY_AMERICAN_PROGRAM_IDS[optionsProgramId.toString()] ===
          ProgramVersions.V1
        ) {
          ({
            openOrdersAddress,
            transaction: placeOrderTx,
            signers: placeOrderSigners,
          } = await serumMarket.makePlaceOrderTransaction(connection, {
            ...orderArgs,
          }));
        } else {
          const { openOrdersKey, tx } =
            await serumInstructions.newOrderInstruction(
              program,
              optionMarket.pubkey,
              new PublicKey(optionMarket.serumProgramId),
              optionMarket.serumMarketKey,
              orderArgs,
            );
          placeOrderTx = tx;
          openOrdersAddress = openOrdersKey;
        }
        transaction.add(placeOrderTx);
        signers = [...signers, ...placeOrderSigners];

        if (openOrdersAddress) {
          createAdHocOpenOrdersSub(openOrdersAddress);
        }

        await sendTransaction({
          transaction,
          wallet,
          signers,
          connection,
          sendingMessage: 'Processing: Buy contracts',
          successMessage: 'Confirmed: Buy contracts',
        });
      } catch (err) {
        pushErrorNotification(err);
      }
    },
    [
      connection,
      createAdHocOpenOrdersSub,
      program,
      pushErrorNotification,
      sendTransaction,
      subscribeToTokenAccount,
      wallet,
    ],
  );
};

export default usePlaceBuyOrder;
