import { Account, Connection, PublicKey } from '@solana/web3.js'
import { Market } from '@mithraic-labs/psyoptions'
import { getSolanaConfig } from './helpers'
import { Market as SerumMarket } from '@mithraic-labs/serum'

const fs = require('fs')

const OPTION_PROGRAM_ID = new PublicKey(
  '6RX6shL4vRaTXWvwDFrh3rkXQGMfkZTY1zzoxE5ZTZ5p',
)

const DEX_PROGRAM_ID = new PublicKey(
  'DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY',
)

;(async () => {
  const connection = new Connection('https://devnet.solana.com')

  const solanaConfig = getSolanaConfig()
  const keyBuffer = fs.readFileSync(solanaConfig.keypair_path)
  const payer = new Account(JSON.parse(keyBuffer))

  const devnetBTCKey = new PublicKey(
    'C6kYXcaRUMqeBF5fhg165RWU7AnpT9z92fvKNoMqjmz6',
  )
  const devnetUSDCKey = new PublicKey(
    'HinfVnJuzMtJsyuLE2ArYCChDZB6FCxEu2p3CQeMcDiF',
  )

  let res = await Market.getAllMarketsBySplSupport(
    connection,
    OPTION_PROGRAM_ID,
    [devnetBTCKey, devnetUSDCKey],
  )

  const marketMetaData = []
  await Promise.all(
    res.map(async (market) => {
      try {
        const underlyingAssetMint = market.marketData.underlyingAssetMintKey.toString()
        const quoteAssetMint = market.marketData.quoteAssetMintKey.toString()
        let quoteAssetSymbol, underlyingAssetSymbol
        if (quoteAssetMint === devnetBTCKey.toString()) {
          quoteAssetSymbol = 'BTC'
        } else if (quoteAssetMint === devnetUSDCKey.toString()) {
          quoteAssetSymbol = 'USDC'
        }
        if (underlyingAssetMint === devnetBTCKey.toString()) {
          underlyingAssetSymbol = 'BTC'
        } else if (underlyingAssetMint === devnetUSDCKey.toString()) {
          underlyingAssetSymbol = 'USDC'
        }

        const serumMarketMeta = await SerumMarket.findAccountsByMints(
          connection,
          market.marketData.optionMintKey,
          devnetUSDCKey,
          DEX_PROGRAM_ID,
        )

        marketMetaData.push({
          expiration: market.marketData.expirationUnixTimestamp,
          optionMarketAddress: market.pubkey.toString(),
          optionContractMintAddress: market.marketData.optionMintKey.toString(),
          optionWriterTokenMintAddress: market.marketData.writerTokenMintKey.toString(),
          quoteAssetMint,
          quoteAssetSymbol,
          underlyingAssetMint,
          underlyingAssetSymbol,
          underlyingAssetPerContract: market.marketData.amountPerContract.toString(),
          quoteAssetPerContract: market.marketData.quoteAmountPerContract.toString(),
          serumMarketAddress: serumMarketMeta[0].publicKey.toString(),
        })
      } catch (error) {
        console.log(`ERROR: for market ${market.pubkey.toString()}\n`, error)
      }
    }),
  )

  const outputFile = 'marketMeta.json'
  fs.writeFile(outputFile, JSON.stringify(marketMetaData), (err) => {
    if (err) throw err
    console.log('Saved!')
  })
})()
