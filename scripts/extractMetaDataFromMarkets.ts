import { Connection, PublicKey } from '@solana/web3.js'
import { Market } from '@mithraic-labs/psyoptions'
import { Market as SerumMarket } from '@mithraic-labs/serum'

const fs = require('fs')

const wait = (delayMS: number) =>
  new Promise((resolve) => setTimeout(resolve, delayMS))

const OPTION_PROGRAM_ID = new PublicKey(
  'GDvqQy3FkDB2wyNwgZGp5YkmRMUmWbhNNWDMYKbLSZ5N',
)

const DEX_PROGRAM_ID = new PublicKey(
  'DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY',
)

;(async () => {
  const connection = new Connection('https://api.devnet.solana.com')

  const devnetBTCKey = new PublicKey(
    'C6kYXcaRUMqeBF5fhg165RWU7AnpT9z92fvKNoMqjmz6',
  )
  const devnetUSDCKey = new PublicKey(
    'E6Z6zLzk8MWY3TY8E87mr88FhGowEPJTeMWzkqtL6qkF',
  )

  let res = await Market.getAllMarketsBySplSupport(
    connection,
    OPTION_PROGRAM_ID,
    [devnetBTCKey, devnetUSDCKey],
  )

  const marketMetaData = []
  const starterPromise = Promise.resolve(null)
  await res.reduce(async (accumulator, market) => {
    await accumulator
    // Avoid RPC node limits
    await wait(1000)
    try {
      const underlyingAssetMint =
        market.marketData.underlyingAssetMintKey.toString()
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
        expiration: market.marketData.expiration,
        optionMarketAddress: market.marketData.optionMarketKey.toString(),
        optionContractMintAddress: market.marketData.optionMintKey.toString(),
        optionWriterTokenMintAddress:
          market.marketData.writerTokenMintKey.toString(),
        quoteAssetMint,
        quoteAssetPoolAddress: market.marketData.quoteAssetPoolKey.toString(),
        quoteAssetSymbol,
        underlyingAssetMint,
        underlyingAssetPoolAddress:
          market.marketData.underlyingAssetPoolKey.toString(),
        underlyingAssetSymbol,
        underlyingAssetPerContract:
          market.marketData.amountPerContract.toString(),
        quoteAssetPerContract:
          market.marketData.quoteAmountPerContract.toString(),
        serumMarketAddress: serumMarketMeta[0].publicKey.toString(),
      })
    } catch (error) {
      console.log(`ERROR: for market ${market.pubkey.toString()}\n`, error)
    }
    return null
  }, starterPromise)

  const outputFile = 'marketMeta.json'
  fs.writeFile(outputFile, JSON.stringify(marketMetaData), (err) => {
    if (err) throw err
    console.log('Saved!')
  })
})()
