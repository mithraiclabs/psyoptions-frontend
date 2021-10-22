import {
  feeAmountPerContract,
  instructions,
  OptionMarketWithKey,
} from '@mithraic-labs/psy-american';
import { BN } from '@project-serum/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { PublicKey, Signer, Transaction } from '@solana/web3.js';
import { useCallback } from 'react';
import { useSolanaMeta } from '../../context/SolanaMetaContext';
import { NotificationSeverity } from '../../types';
import {
  initializeTokenAccountTx,
  WRAPPED_SOL_ADDRESS,
} from '../../utils/token';
import { useAmericanPsyOptionsProgram } from '../useAmericanPsyOptionsProgram';
import useNotifications from '../useNotifications';
import { useConnectedWallet } from "@saberhq/use-solana";

export const useMintOptions = (): ((
  option: OptionMarketWithKey,
  size: number,
) => Promise<void>) => {
  const program = useAmericanPsyOptionsProgram();
  const { pushErrorNotification, pushNotification } = useNotifications();
  const { splTokenAccountRentBalance } = useSolanaMeta();
  const wallet = useConnectedWallet();

  return useCallback(
    async (option, size) => {
      if (!wallet?.publicKey || !program) {
        return;
      }
      try {
        pushNotification({
          severity: NotificationSeverity.INFO,
          message: 'Processing: Mint Options',
        });

        const transaction = new Transaction();
        const signers: Signer[] = [];
        let _underlyingAssetSourceKey: PublicKey | null = null;
        if (option.underlyingAssetMint.toString() === WRAPPED_SOL_ADDRESS) {
          const fees = feeAmountPerContract(option.underlyingAmountPerContract);
          const lamports = option.underlyingAmountPerContract
            .add(fees)
            .mul(new BN(size));
          const { transaction: wrapSolTx, newTokenAccount: wrappedSolAccount } =
            await initializeTokenAccountTx({
              connection: program.provider.connection,
              payerKey: wallet.publicKey,
              mintPublicKey: new PublicKey(WRAPPED_SOL_ADDRESS),
              owner: wallet.publicKey,
              rentBalance: splTokenAccountRentBalance,
              extraLamports: lamports.toNumber(),
            });
          transaction.add(wrapSolTx);
          signers.push(wrappedSolAccount);
          _underlyingAssetSourceKey = wrappedSolAccount.publicKey;
        }

        const [optionTokenDest, writerTokenDest, underlyingAssetSource] =
          await Promise.all([
            Token.getAssociatedTokenAddress(
              ASSOCIATED_TOKEN_PROGRAM_ID,
              TOKEN_PROGRAM_ID,
              option.optionMint,
              wallet.publicKey,
            ),
            Token.getAssociatedTokenAddress(
              ASSOCIATED_TOKEN_PROGRAM_ID,
              TOKEN_PROGRAM_ID,
              option.writerTokenMint,
              wallet.publicKey,
            ),
            ...(option.underlyingAssetMint.toString() === WRAPPED_SOL_ADDRESS
              ? []
              : [
                  Token.getAssociatedTokenAddress(
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                    TOKEN_PROGRAM_ID,
                    option.underlyingAssetMint,
                    wallet.publicKey,
                  ),
                ]),
          ]);
        if (underlyingAssetSource) {
          _underlyingAssetSourceKey = underlyingAssetSource;
        }
        const optionToken = new Token(
          program.provider.connection,
          option.optionMint,
          TOKEN_PROGRAM_ID,
          null as unknown as Signer,
        );
        const writerToken = new Token(
          program.provider.connection,
          option.writerTokenMint,
          TOKEN_PROGRAM_ID,
          null as unknown as Signer,
        );
        try {
          await optionToken.getAccountInfo(optionTokenDest);
        } catch (err) {
          // no account found, generate instruction to create it
          const ix = Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            option.optionMint,
            optionTokenDest,
            wallet.publicKey,
            wallet.publicKey,
          );
          transaction.add(ix);
        }
        try {
          await writerToken.getAccountInfo(writerTokenDest);
        } catch (err) {
          // no account found, generate instruction to create it
          const ix = Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            option.writerTokenMint,
            writerTokenDest,
            wallet.publicKey,
            wallet.publicKey,
          );
          transaction.add(ix);
        }

        const { ix, signers: _signers } =
          await instructions.mintOptionInstruction(
            program,
            optionTokenDest,
            writerTokenDest,
            _underlyingAssetSourceKey as PublicKey,
            new BN(size),
            option,
          );
        transaction.add(ix);
        signers.concat(_signers);
        if (option.underlyingAssetMint.toString() === WRAPPED_SOL_ADDRESS) {
          const closeWSolIx = Token.createCloseAccountInstruction(
            TOKEN_PROGRAM_ID,
            _underlyingAssetSourceKey as PublicKey,
            wallet.publicKey, // Send any remaining SOL to the owner
            wallet.publicKey,
            [],
          );
          transaction.add(closeWSolIx);
        }
        if (signers.length) {
          transaction.feePayer = wallet.publicKey;
          transaction.recentBlockhash = (
            await program.provider.connection.getRecentBlockhash('max')
          ).blockhash;
          transaction.partialSign(...signers);
        }
        await wallet.signTransaction(transaction);

        await program.provider.connection.sendRawTransaction(
          transaction.serialize(),
        );

        pushNotification({
          severity: NotificationSeverity.SUCCESS,
          message: 'Confirmed: Mint Options',
        });
      } catch (err) {
        return pushErrorNotification(err);
      }
    },
    [
      program,
      pushErrorNotification,
      pushNotification,
      splTokenAccountRentBalance,
      wallet,
    ],
  );
};
