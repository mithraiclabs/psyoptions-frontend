import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Signer,
  Transaction,
} from '@solana/web3.js';
import { useCallback } from 'react';
import { Market, OrderParams } from '@mithraic-labs/serum/lib/market';
import {
  PSY_AMERICAN_PROGRAM_IDS,
  ProgramVersions,
  serumInstructions,
  OptionMarketWithKey,
} from '@mithraic-labs/psy-american';
import { createAssociatedTokenAccountInstruction } from '../utils/instructions/token';
import { useConnectedWallet } from '@saberhq/use-solana';
import useNotifications from './useNotifications';
import useConnection from './useConnection';
import useSendTransaction from './useSendTransaction';
import useOwnedTokenAccounts from './useOwnedTokenAccounts';
import { useCreateAdHocOpenOrdersSubscription } from './Serum';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';
import { useManualExerciseWarning } from '../components/ManualExerciseWarning';
import { initializeTokenAccountTx, WRAPPED_SOL_ADDRESS } from '@/utils/token';
import { useSolanaMeta } from '@/context/SolanaMetaContext';
import { BN } from '@project-serum/anchor';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';

type PlaceBuyOrderArgs = {
  option: OptionMarketWithKey;
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
  const { connection, dexProgramId } = useConnection();
  const { sendTransaction } = useSendTransaction();
  const { subscribeToTokenAccount } = useOwnedTokenAccounts();
  const { splTokenAccountRentBalance } = useSolanaMeta();
  const [, setManualExerciseWarningVisible] = useManualExerciseWarning();
  const createAdHocOpenOrdersSub =
    useCreateAdHocOpenOrdersSubscription(serumMarketAddress);

  return useCallback(
    async ({
      option,
      serumMarket,
      orderArgs,
      optionDestinationKey,
    }: PlaceBuyOrderArgs) => {
      if (
        !connection ||
        !wallet?.publicKey ||
        !program ||
        !dexProgramId ||
        !splTokenAccountRentBalance
      ) {
        return;
      }

      setManualExerciseWarningVisible(true);

      try {
        const transaction = new Transaction();
        let signers: Signer[] = [];
        const _optionDestinationKey = optionDestinationKey;

        if (!_optionDestinationKey) {
          // Create a SPL Token account for this option market if the wallet doesn't have one
          const [createOptAccountIx, newPublicKey] =
            await createAssociatedTokenAccountInstruction({
              payer: wallet.publicKey,
              owner: wallet.publicKey,
              mintPublicKey: option.optionMint,
            });

          transaction.add(createOptAccountIx);
          subscribeToTokenAccount(newPublicKey);
        }

        // Handle Wrapped SOL for bidding
        if (serumMarket.quoteMintAddress.toString() === WRAPPED_SOL_ADDRESS) {
          // Calculate the amount of lamports the account needs
          // TODO: fix for JS overflow with 53bit number
          const lamports = new BN(
            orderArgs.price * orderArgs.size * LAMPORTS_PER_SOL,
          );
          const { transaction: tx, newTokenAccount } =
            await initializeTokenAccountTx({
              connection: program.provider.connection,
              payerKey: wallet.publicKey,
              mintPublicKey: new PublicKey(WRAPPED_SOL_ADDRESS),
              owner: wallet.publicKey,
              rentBalance: splTokenAccountRentBalance,
              extraLamports: lamports.toNumber(),
            });
          transaction.add(tx);
          signers.push(newTokenAccount);
          orderArgs.payer = newTokenAccount.publicKey;
        }

        // place the buy order
        let placeOrderTx: Transaction;
        let placeOrderSigners: Signer[] = [];
        let openOrdersAddress: PublicKey;
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
          }));
        } else {
          const serumMarketKey = serumMarket.address;
          const { openOrdersKey, tx } =
            await serumInstructions.newOrderInstruction(
              program,
              option.key,
              dexProgramId,
              serumMarketKey,
              orderArgs,
            );
          placeOrderTx = tx;
          openOrdersAddress = openOrdersKey;
        }
        transaction.add(placeOrderTx);
        signers = [...signers, ...placeOrderSigners];

        if (openOrdersAddress) {
          createAdHocOpenOrdersSub(openOrdersAddress, option.key.toString());
        }
        // Close out the wrapped SOL account so it feels native
        if (serumMarket.quoteMintAddress.toString() === WRAPPED_SOL_ADDRESS) {
          transaction.add(
            Token.createCloseAccountInstruction(
              TOKEN_PROGRAM_ID,
              orderArgs.payer,
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
      dexProgramId,
      program,
      pushErrorNotification,
      sendTransaction,
      setManualExerciseWarningVisible,
      splTokenAccountRentBalance,
      subscribeToTokenAccount,
      wallet,
    ],
  );
};

export default usePlaceBuyOrder;
