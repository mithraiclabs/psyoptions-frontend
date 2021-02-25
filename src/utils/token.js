import { SystemProgram, Transaction, Account } from '@solana/web3.js'
import { AccountLayout, Token } from '@solana/spl-token'
import { TOKEN_PROGRAM_ID } from './tokenInstructions'

export async function initializeTokenAccountTx({
  connection,
  payer,
  mintPublicKey,
  owner,
}) {
  const newAccount = new Account()
  const transaction = new Transaction()

  const tokenAccountRentBalance = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span
  )

  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: newAccount.publicKey,
      lamports: tokenAccountRentBalance,
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

  transaction.feePayer = payer.publicKey
  const { blockhash } = await connection.getRecentBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.partialSign(newAccount)

  return [transaction, newAccount]
}

// return await signAndSendTransaction(connection, transaction, payer, signers)
