const SPLToken = require('@solana/spl-token')
const SolWeb3 = require('@solana/web3.js')
const fs = require('fs')

const { MintLayout, Token, TOKEN_PROGRAM_ID } = SPLToken
const {
  Account,
  Connection,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
} = SolWeb3

/**
 * Create Account with 1000 (i think) SOL
 */
const createPayerWithSol = async (connection, amount = 100000000000) => {
  const payer = new Account()
  console.log(`requesting airdrop of ${amount} to ${payer.publicKey}`)
  await connection.requestAirdrop(payer.publicKey, amount)
  let retries = 60
  for (;;) {
    // sleep half a second
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const balance = await connection.getBalance(payer.publicKey)
    console.log('account balance ', balance)
    if (amount === balance) {
      return payer
    }
    if (--retries <= 0) {
      throw new Error('Failed to airdrop SOL to payer for seed')
    }
  }
}

const trustWalletERC20Icon = (address) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`

/**
 * Seed local net with SPL tokens for development purposes.
 * Localnet must be running prior to invoking this script
 */
;(async () => {
  const connection = new Connection('http://127.0.0.1:8899')
  const keyPairFilePath = process.argv[2]
  let payer
  if (!keyPairFilePath) {
    throw new Error('Please supply path to keypair `-- PATH_TO_KEYPAIR`')
  }
  const keyBuffer = fs.readFileSync(keyPairFilePath)
  payer = new Account(JSON.parse(keyBuffer))

  const splMint1 = new Account()
  const splMint2 = new Account()
  const splMint3 = new Account()
  const splMint4 = new Account()

  console.log(
    'Attempting to create SPL Mints ',
    splMint1.publicKey.toString(),
    splMint2.publicKey.toString(),
    splMint3.publicKey.toString(),
    splMint4.publicKey.toString()
  )

  const transaction = new Transaction()
  const mintBalance = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span
  )

  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: splMint1.publicKey,
      lamports: mintBalance,
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    }),
    Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      splMint1.publicKey,
      8,
      payer.publicKey,
      null
    ),
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: splMint2.publicKey,
      lamports: mintBalance,
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    }),
    Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      splMint2.publicKey,
      8,
      payer.publicKey,
      null
    ),
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: splMint3.publicKey,
      lamports: mintBalance,
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    }),
    Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      splMint3.publicKey,
      8,
      payer.publicKey,
      null
    ),
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: splMint4.publicKey,
      lamports: mintBalance,
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    }),
    Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      splMint4.publicKey,
      8,
      payer.publicKey,
      null
    )
  )
  const signers = [payer, splMint1, splMint2, splMint3, splMint4]
  await sendAndConfirmTransaction(connection, transaction, signers, {
    skipPreflight: true,
    commitment: 'recent',
  })

  // Generate sample assets from local net data and random logos
  const localSPLData = [
    {
      mintAddress: splMint1.publicKey.toString(),
      tokenSymbol: 'SPL1',
      tokenName: 'SPL 1',
      icon: trustWalletERC20Icon('0xdAC17F958D2ee523a2206206994597C13D831ec7'),
    },
    {
      mintAddress: splMint2.publicKey.toString(),
      tokenSymbol: 'SPL2',
      tokenName: 'SPL 2',
      icon: trustWalletERC20Icon('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
    },
    {
      mintAddress: splMint3.publicKey.toString(),
      tokenSymbol: 'SPL3',
      tokenName: 'SPL 3',
      icon: trustWalletERC20Icon('0x476c5E26a75bd202a9683ffD34359C0CC15be0fF'),
    },
    {
      mintAddress: splMint4.publicKey.toString(),
      tokenSymbol: 'SPL4',
      tokenName: 'SPL 4',
      icon: trustWalletERC20Icon('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
    },
  ]
  fs.writeFileSync(
    './src/hooks/localnetData.json',
    JSON.stringify(localSPLData)
  )
})()
