/**
 * This file is for pure functions only. They are to extract some of the
 * complexities out of the application code, while still allowing the application to
 * fetch and update data in their own manner.
 */

import { AccountLayout, Token } from '@solana/spl-token'
import { Account, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { CreateNewTokenAccountResponse } from 'src/types'
import { TOKEN_PROGRAM_ID } from '../tokenInstructions'

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
  fromPubkey: PublicKey
  owner: PublicKey
  mintPublicKey: PublicKey
  splTokenAccountRentBalance: number
  extraLamports?: number
}): CreateNewTokenAccountResponse => {
  const newAccount = new Account()
  const transaction = new Transaction()

  transaction.add(
    SystemProgram.createAccount({
      fromPubkey,
      newAccountPubkey: newAccount.publicKey,
      lamports: splTokenAccountRentBalance + extraLamports,
      space: AccountLayout.span,
      programId: TOKEN_PROGRAM_ID,
    }),
  )

  transaction.add(
    Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      mintPublicKey,
      newAccount.publicKey,
      owner,
    ),
  )

  const signers = [newAccount]

  return { transaction, signers, newTokenAccount: newAccount }
}
