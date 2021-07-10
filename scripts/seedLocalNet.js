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
    splMint4.publicKey.toString(),
  )

  const transaction = new Transaction()
  const mintBalance = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span,
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
      null,
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
      null,
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
      null,
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
      null,
    ),
  )
  const signers = [payer, splMint1, splMint2, splMint3, splMint4]
  await sendAndConfirmTransaction(connection, transaction, signers, {
    skipPreflight: true,
    commitment: 'recent',
  })

  // Generate sample assets from local net data and random logos
  const localSPLData = [
    {
      decimals: 8,
      mintAddress: splMint4.publicKey.toString(),
      tokenSymbol: 'BTC',
      tokenName: 'Bitcoin',
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
    },
    {
      decimals: 8,
      mintAddress: splMint1.publicKey.toString(),
      tokenSymbol: 'LSRM',
      tokenName: 'Serum',
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x476c5E26a75bd202a9683ffD34359C0CC15be0fF/logo.png',
    },
    {
      decimals: 8,
      mintAddress: splMint3.publicKey.toString(),
      tokenSymbol: 'ETH',
      tokenName: 'Ethereum',
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    },
    {
      decimals: 8,
      mintAddress: splMint2.publicKey.toString(),
      tokenSymbol: 'USDC',
      tokenName: 'USDC',
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/f3ffd0b9ae2165336279ce2f8db1981a55ce30f8/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    },
  ]
  fs.writeFileSync(
    './src/hooks/localnetData.json',
    JSON.stringify(localSPLData),
  )
})()
