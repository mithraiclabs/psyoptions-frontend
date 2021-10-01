import { instructions, OptionMarketWithKey } from '@mithraic-labs/psy-american';
import { BN } from '@project-serum/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Signer, Transaction } from '@solana/web3.js';
import { useCallback } from 'react';
import { NotificationSeverity } from '../../types';
import { useAmericanPsyOptionsProgram } from '../useAmericanPsyOptionsProgram';
import useNotifications from '../useNotifications';
import useWallet from '../useWallet';

export const useMintOptions = (): ((
  option: OptionMarketWithKey,
  size: number,
) => Promise<void>) => {
  const program = useAmericanPsyOptionsProgram();
  const { pushErrorNotification, pushNotification } = useNotifications();
  const { wallet } = useWallet();

  return useCallback(
    async (option, size) => {
      if (!wallet || !program) {
        return;
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
          Token.getAssociatedTokenAddress(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            option.underlyingAssetMint,
            wallet.publicKey,
          ),
        ]);
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
      const transaction = new Transaction();
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
        await writerToken.getAccountInfo(option.writerTokenMint);
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
      if (transaction.instructions.length) {
        // create associated token accounts if there are any instructions
        await program.provider.send(transaction);
      }

      try {
        pushNotification({
          severity: NotificationSeverity.INFO,
          message: 'Processing: Mint Options',
        });
        await instructions.mintOptionsTx(
          program,
          optionTokenDest,
          writerTokenDest,
          underlyingAssetSource,
          new BN(size),
          option,
        );
        pushNotification({
          severity: NotificationSeverity.SUCCESS,
          message: 'Confirmed: Mint Options',
        });
      } catch (err) {
        pushErrorNotification(err);
      }
    },
    [program, pushErrorNotification, pushNotification, wallet],
  );
};
