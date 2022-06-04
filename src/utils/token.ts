import {
  SystemProgram,
  Transaction,
  Account,
  Connection,
  PublicKey,
  Keypair,
} from '@solana/web3.js';
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TokenAccount } from '../types';

export const WRAPPED_SOL_ADDRESS =
  'So11111111111111111111111111111111111111112';

export async function initializeTokenAccountTx({
  connection,
  extraLamports = 0,
  payerKey,
  mintPublicKey,
  owner,
  rentBalance,
}: {
  connection: Connection;
  extraLamports?: number;
  payerKey: PublicKey;
  mintPublicKey: PublicKey;
  owner: PublicKey;
  rentBalance: number;
}): Promise<{ transaction: Transaction; newTokenAccount: Keypair }> {
  const newAccount = new Keypair();
  const transaction = new Transaction();

  let _rentBalance = rentBalance;
  if (!rentBalance) {
    _rentBalance = await connection.getMinimumBalanceForRentExemption(
      AccountLayout.span,
    );
  }

  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: payerKey,
      newAccountPubkey: newAccount.publicKey,
      lamports: _rentBalance + extraLamports,
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

  return { transaction, newTokenAccount: newAccount };
}

export const getHighestAccount = (
  accounts: TokenAccount[],
): TokenAccount | null => {
  if (accounts.length === 0) return null;
  if (accounts.length === 1) return accounts[0];
  return accounts.sort((a, b) => b.amount - a.amount)[0];
};
