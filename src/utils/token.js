import { PublicKey, SystemProgram, Transaction, Account } from '@solana/web3.js'
import { initializeAccount, TOKEN_PROGRAM_ID } from './tokenInstructions'
import * as BufferLayout from 'buffer-layout'

const ACCOUNT_LAYOUT = BufferLayout.struct([
  BufferLayout.blob(32, 'mint'),
  BufferLayout.blob(32, 'owner'),
  BufferLayout.nu64('amount'),
  BufferLayout.blob(93),
])

export async function initializeTokenAccountTx({
  connection,
  payer,
  mintPublicKey,
}) {
  const newAccount = new Account()
  const transaction = new Transaction()
  console.log(newAccount)

  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: newAccount.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        ACCOUNT_LAYOUT.span
      ),
      space: ACCOUNT_LAYOUT.span,
      programId: TOKEN_PROGRAM_ID,
    })
  )

  transaction.add(
    initializeAccount({
      account: newAccount.publicKey,
      mint: mintPublicKey,
      owner: payer.publicKey,
    })
  )

  transaction.feePayer = payer.publicKey
  transaction.recentBlockhash = await connection.getRecentBlockhash()
  transaction.partialSign(newAccount)

  return [transaction, newAccount]
}

// return await signAndSendTransaction(connection, transaction, payer, signers)
