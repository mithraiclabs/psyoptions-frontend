import { SystemProgram, Transaction, Account } from '@solana/web3.js'
import { AccountLayout, Token } from '@solana/spl-token'
import { TOKEN_PROGRAM_ID } from './tokenInstructions'

export const WRAPPED_SOL_ADDRESS = 'So11111111111111111111111111111111111111112';

export async function initializeTokenAccountTx({
  connection,
  extraLamports = 0,
  payer,
  mintPublicKey,
  owner,
  rentBalance,
}) {
  const newAccount = new Account()
  const transaction = new Transaction()

  let _rentBalance = rentBalance
  if (!rentBalance) {
    _rentBalance = await connection.getMinimumBalanceForRentExemption(
      AccountLayout.span
    )

  }

  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: newAccount.publicKey,
      lamports: _rentBalance + extraLamports,
      space: AccountLayout.span,
      programId: TOKEN_PROGRAM_ID,
    })
  )

  transaction.add(
    Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      mintPublicKey,
      newAccount.publicKey,
      owner
    )
  )

  return {transaction, newTokenAccount: newAccount}
}

// return await signAndSendTransaction(connection, transaction, payer, signers)
