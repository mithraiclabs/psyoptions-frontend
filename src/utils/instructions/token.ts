/**
 * This file is for pure functions only. They are to extract some of the
 * complexities out of the application code, while still allowing the application to
 * fetch and update data in their own manner.
 */

import { AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  Account,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { CreateNewTokenAccountResponse } from 'src/types';

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);

/**
 * Create and initialize a new SPL Token account for the provided owner. Initial
 * lamports are give from the _fromPubkey_ account.
 */
export const createNewTokenAccount = ({
  fromPubkey,
  owner,
  mintPublicKey,
  splTokenAccountRentBalance,
  extraLamports = 0,
}: {
  fromPubkey: PublicKey;
  owner: PublicKey;
  mintPublicKey: PublicKey;
  splTokenAccountRentBalance: number;
  extraLamports?: number;
}): CreateNewTokenAccountResponse => {
  const newAccount = new Account();
  const transaction = new Transaction();

  transaction.add(
    SystemProgram.createAccount({
      fromPubkey,
      newAccountPubkey: newAccount.publicKey,
      lamports: splTokenAccountRentBalance + extraLamports,
      space: AccountLayout.span,
      programId: TOKEN_PROGRAM_ID,
    }),
  );

  transaction.add(
    Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      mintPublicKey,
      newAccount.publicKey,
      owner,
    ),
  );

  const signers = [newAccount];

  return { transaction, signers, newTokenAccount: newAccount };
};

/**
 * Create and initialize a Associated SPL Token account for the provided owner.
 *
 * TODO: refactor to use the SPL Token JS library (https://github.com/solana-labs/solana-program-library/blob/master/token/js/client/token.js#L2306)
 */
export const createAssociatedTokenAccountInstruction = async ({
  payer,
  owner,
  mintPublicKey,
}: {
  payer: PublicKey;
  owner: PublicKey;
  mintPublicKey: PublicKey;
}): Promise<[TransactionInstruction, PublicKey]> => {
  const [associatedTokenPublicKey] = await PublicKey.findProgramAddress(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintPublicKey.toBuffer()],
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  );
  const ix = new TransactionInstruction({
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedTokenPublicKey, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mintPublicKey, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  });

  return [ix, associatedTokenPublicKey];
};
