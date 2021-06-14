import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmRawTransaction,
  Transaction,
} from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  initializeAccountsForMarket,
  initializeMarketInstruction,
} from '@mithraic-labs/psyoptions'
import BigNumber from 'bignumber.js'
import { getSolanaConfig } from './helpers'

const fs = require('fs')

const OPTION_PROGRAM_ID = new PublicKey(
  'GDvqQy3FkDB2wyNwgZGp5YkmRMUmWbhNNWDMYKbLSZ5N',
)

;(async () => {
  const marketMetaDataFile = process.argv[2]
  if (!fs.existsSync(marketMetaDataFile)) {
    console.error('meta data file argument is missing or file does not exist')
    process.exit(1)
  }

  const marketsMeta = JSON.parse(fs.readFileSync(marketMetaDataFile))

  const connection = new Connection('https://devnet.solana.com')

  const solanaConfig = getSolanaConfig()
  const keyBuffer = fs.readFileSync(solanaConfig.keypair_path)
  const payer = new Keypair(JSON.parse(keyBuffer))

  const newOptionMarketAddresses = []
  const starterPromise = Promise.resolve(null)
  // This is run sequentially to avoid RPC node rate limits =/
  await marketsMeta.reduce(async (accumulator, marketMeta) => {
    await accumulator
    return (async () => {
      const underlyingAssetMintKey = new PublicKey(
        marketMeta.underlyingAssetMint,
      )
      const quoteAssetMintKey = new PublicKey(marketMeta.quoteAssetMint)
      const underlyingAsset = new Token(
        connection,
        underlyingAssetMintKey,
        TOKEN_PROGRAM_ID,
        payer,
      )
      const underlyingMintInfo = await underlyingAsset.getMintInfo()
      const quoteAsset = new Token(
        connection,
        quoteAssetMintKey,
        TOKEN_PROGRAM_ID,
        payer,
      )
      const quoteMintInfo = await quoteAsset.getMintInfo()

      // Create and send transaction for creating/initializing accounts needed
      // for option market
      const {
        transaction: createAccountsTx,
        signers,
        optionMarketKey,
        optionMintKey,
        writerTokenMintKey,
        quoteAssetPoolKey,
        underlyingAssetPoolKey,
      } = await initializeAccountsForMarket({
        connection,
        payerKey: payer.publicKey,
        programId: OPTION_PROGRAM_ID,
      })
      createAccountsTx.partialSign(...signers)
      await sendAndConfirmRawTransaction(
        connection,
        createAccountsTx.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'recent',
          commitment: 'max',
        },
      )

      // create and send transaction for initializing the option market
      const initializeMarketIx = await initializeMarketInstruction({
        programId: OPTION_PROGRAM_ID,
        fundingAccountKey: payer.publicKey,
        underlyingAssetMintKey,
        quoteAssetMintKey,
        optionMintKey,
        writerTokenMintKey,
        optionMarketKey,
        underlyingAssetPoolKey,
        quoteAssetPoolKey,
        underlyingAmountPerContract: new BigNumber(
          marketMeta.underlyingAssetPerContract,
        ).toNumber(),
        quoteAmountPerContract: new BigNumber(
          marketMeta.quoteAssetPerContract,
        ).toNumber(),
        expirationUnixTimestamp: marketMeta.expiration,
      })
      const transaction = new Transaction()
      transaction.add(initializeMarketIx)
      transaction.partialSign(payer)

      const txId = await sendAndConfirmRawTransaction(
        connection,
        transaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'recent',
          commitment: 'max',
        },
      )
      console.log(`* confirmed mint TX id: ${txId}`)
      newOptionMarketAddresses.push(optionMarketKey.toString())
    })()
  }, starterPromise)

  console.log('Storing new address information to file')
  const outputFile = 'newMarkets2.json'
  if (!fs.existsSync(outputFile)) {
    fs.writeFile(
      outputFile,
      JSON.stringify(newOptionMarketAddresses),
      (err) => {
        if (err) throw err
        console.log('Saved!')
      },
    )
  }
})()

export {}
