import {
  Account,
  Connection,
  PublicKey,
  sendAndConfirmRawTransaction,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Market, initializeMarket } from '@mithraic-labs/psyoptions'
import BigNumber from 'bignumber.js'
import { getSolanaConfig } from './helpers'

const fs = require('fs')

const OPTION_PROGRAM_ID = new PublicKey(
  '6RX6shL4vRaTXWvwDFrh3rkXQGMfkZTY1zzoxE5ZTZ5p',
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
  const payer = new Account(JSON.parse(keyBuffer))

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
      const {
        transaction,
        signers,
        optionMarketDataAddress,
      } = await initializeMarket({
        connection,
        payer,
        programId: OPTION_PROGRAM_ID,
        underlyingAssetMintKey,
        quoteAssetMintKey,
        underlyingAssetDecimals: underlyingMintInfo.decimals,
        quoteAssetDecimals: quoteMintInfo.decimals,
        underlyingAmountPerContract: new BigNumber(
          marketMeta.underlyingAssetPerContract,
        ),
        quoteAmountPerContract: new BigNumber(marketMeta.quoteAssetPerContract),
        expirationUnixTimestamp: marketMeta.expiration,
      })
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
      newOptionMarketAddresses.push(optionMarketDataAddress)
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
