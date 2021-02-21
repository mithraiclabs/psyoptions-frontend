import useLocalStorageState from 'use-local-storage-state'
import { initializeMarket } from '@mithraic-labs/options-js-bindings'

import useWallet from './useWallet'
import useConnection from './useConnection'

// Example of how markets data should look:
// const markets = {
//   '1614556800-SOL-USDC-700-14': {
//     createdByMe: true
//     expiration: 1614556800
//     key: "1614556800-SOL-USDC-700-14"
//     optionMarketDataAddress: "HtHcqroXGpRe5UATqYSAWenEgXK6wac3iMa8GWUaqA9j"
//     optionMintAddress: "8ovRGAZKbD6VD67h4BdnPY83iQohSeA4B1YZY5LwErFu"
//     qAssetMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
//     qAssetSymbol: "USDC"
//     size: 700
//     strikePrice: 14
//     uAssetMint: "So11111111111111111111111111111111111111112"
//     uAssetSymbol: "SOL"
//   },
// }

const useOptionsMarkets = () => {
  const { wallet, pubKey } = useWallet()
  const { connection, endpoint } = useConnection()
  const [markets, setMarkets] = useLocalStorageState('optionsMarkets', {})

  // TODO: add useEffect to update markets data from remote backend

  const loaded = true

  const getSizes = ({ uAssetSymbol, qAssetSymbol, date }) => {
    const keyPart = `${date}-${uAssetSymbol}-${qAssetSymbol}-`

    const sizes = Object.keys(markets)
      .filter((key) => key.match(keyPart))
      .map((key) => markets[key].size)

    return [...new Set(sizes)]
  }

  const getStrikePrices = ({ uAssetSymbol, qAssetSymbol, date, size }) => {
    const keyPart = `${date}-${uAssetSymbol}-${qAssetSymbol}-${size}-`
    return Object.keys(markets)
      .filter((key) => key.match(keyPart))
      .map((key) => markets[key].strikePrice)
  }

  const getMarket = ({ uAssetSymbol, qAssetSymbol, date, size, price }) => {
    const key = `${date}-${uAssetSymbol}-${qAssetSymbol}-${size}-${price}`
    return markets[key]
  }

  const getDates = () => {
    const dates = Object.values(markets).map((m) => m.expiration)
    const deduped = [...new Set(dates)]
    return deduped
  }

  const initializeMarkets = async ({
    size,
    strikePrices,
    uAssetSymbol,
    qAssetSymbol,
    uAssetMint,
    qAssetMint,
    expiration,
  }) => {
    const results = await Promise.all(
      strikePrices.map(async (strikePrice) => {
        const {
          signers,
          transaction,
          optionMarketDataAddress,
          optionMintAddress,
        } = await initializeMarket(
          connection,
          { publicKey: pubKey },
          endpoint.programId,
          uAssetMint,
          qAssetMint,
          size,
          strikePrice,
          expiration
        )

        const signed = await wallet.signTransaction(transaction)
        const txid = await connection.sendRawTransaction(signed.serialize())

        // TODO: push "toast notifications" here that tx started and set a loading state
        console.log(`Submitted transaction ${txid}`)
        await connection.confirmTransaction(txid, 1)
        // TODO: push "toast notifications" here that tx completed and set loading state to false
        console.log(`Confirmed ${txid}`)

        const marketData = {
          key: `${expiration}-${uAssetSymbol}-${qAssetSymbol}-${size}-${strikePrice}`,
          size,
          strikePrice,
          uAssetSymbol,
          qAssetSymbol,
          uAssetMint,
          qAssetMint,
          expiration,
          optionMarketDataAddress: optionMarketDataAddress.toString(),
          optionMintAddress: optionMintAddress.toString(),
          createdByMe: true,
        }

        return marketData
      })
    )

    const newMarkets = {}
    results.forEach((market) => (newMarkets[market.key] = market))
    setMarkets({ ...markets, ...newMarkets })

    return results
  }

  const getMyMarkets = () => {
    return Object.values(markets).filter((m) => m.createdByMe)
  }

  return {
    initializeMarkets,
    loaded,
    markets,
    getMarket,
    getStrikePrices,
    getSizes,
    getDates,
    getMyMarkets,
  }
}

export default useOptionsMarkets
