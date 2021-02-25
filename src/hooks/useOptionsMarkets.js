import React, { useContext } from 'react'
import { Link } from '@material-ui/core'
import {
  initializeMarket,
  readMarketAndMintCoveredCall,
  Market,
} from '@mithraic-labs/options-js-bindings'

import { Connection, PublicKey } from '@solana/web3.js'

import { buildSolanaExplorerUrl } from '../utils/solanaExplorer'
import useNotifications from './useNotifications'
import useWallet from './useWallet'
import useConnection from './useConnection'
import useAssetList from './useAssetList'
import { useEffect } from 'react'
import { OptionsMarketsContext } from '../context/OptionsMarketsContext'

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
  const { pushNotification } = useNotifications()
  const { wallet, pubKey } = useWallet()
  const { connection, endpoint } = useConnection()
  const { markets, setMarkets } = useContext(OptionsMarketsContext)
  const assetList = useAssetList()

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        if (!(connection instanceof Connection)) return
        const assets = assetList.map(
          (asset) => new PublicKey(asset.mintAddress)
        )
        const res = await Market.getAllMarketsBySplSupport(
          connection,
          new PublicKey(endpoint.programId),
          assets
        )
        // Transform the market data to our expectations
        const newMarkets = {}
        res.forEach((market) => {
          const uAssetMint = market.marketData.underlyingAssetMintAddress
          const uAsset = assetList.filter(
            (asset) => asset.mintAddress === uAssetMint.toString()
          )[0]
          const qAssetMint = market.marketData.quoteAssetMintAddress
          const qAsset = assetList.filter(
            (asset) => asset.mintAddress === qAssetMint.toString()
          )[0]

          const newMarket = {
            // marketData.amountPerContract is a BigNumber
            size: market.marketData.amountPerContract.toString(10),
            expiration: market.marketData.expirationUnixTimestamp,
            uAssetSymbol: uAsset.tokenSymbol,
            qAssetSymbol: qAsset.tokenSymbol,
            uAssetMint: uAsset.mintAddress,
            qAssetMint: qAsset.mintAddress,
            // marketData.strikePrice is a BigNumber
            strikePrice: market.marketData.strikePrice.toString(10),
            optionMintAddress: market.marketData.optionMintAddress.toString(),
            optionMarketDataAddress: market.pubkey.toString(),
          }
          const key = `${newMarket.expiration}-${newMarket.uAssetSymbol}-${newMarket.qAssetSymbol}-${newMarket.size}-${newMarket.strikePrice}`
          newMarkets[key] = newMarket
        })

        // Not sure if we should replace the existing markets or merge them
        setMarkets((prevMarkets) => ({
          ...prevMarkets,
          ...newMarkets,
        }))
      } catch (err) {
        console.error(err)
      }
    }

    fetchMarketData()
  }, [connection])

  const getSizes = ({ uAssetSymbol, qAssetSymbol, date }) => {
    const keyPart = `${date}-${uAssetSymbol}-${qAssetSymbol}-`

    const sizes = Object.keys(markets)
      .filter((key) => key.match(keyPart))
      .map((key) => markets[key].size.toString())

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

        const explorerUrl = buildSolanaExplorerUrl(txid)

        // TODO: make the "View on Solana Explorer" am <a> element instead of text
        pushNotification({
          severity: 'info',
          message: `Submitted Transaction: Initialize Market`,
          link: (
            <Link href={explorerUrl} target="_new">
              View on Solana Explorer
            </Link>
          ),
        })

        await connection.confirmTransaction(txid)

        pushNotification({
          severity: 'success',
          message: `Transaction Confirmed: Initialize Market`,
          link: (
            <Link href={explorerUrl} target="_new">
              View on Solana Explorer
            </Link>
          ),
        })

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

  const mint = async ({
    marketData,
    mintedOptionDestAccount, // account in user's wallet to send minted option to
    underlyingAssetSrcAccount, // account in user's wallet to post uAsset collateral from
    quoteAssetDestAccount, // account in user's wallet to send qAsset to if contract is exercised
  }) => {
    const { transaction: tx, signers } = await readMarketAndMintCoveredCall(
      connection,
      { publicKey: pubKey },
      endpoint.programId,
      new PublicKey(mintedOptionDestAccount),
      new PublicKey(underlyingAssetSrcAccount),
      new PublicKey(quoteAssetDestAccount),
      new PublicKey(marketData.optionMarketDataAddress),
      { publicKey: pubKey } // Option writer's UA Authority account - safe to assume this is always the same as the payer when called from the FE UI
    )

    const signed = await wallet.signTransaction(tx)
    const txid = await connection.sendRawTransaction(signed.serialize())

    pushNotification({
      severity: 'info',
      message: 'Submitted Transaction: Mint Options Token',
      link: (
        <Link href={buildSolanaExplorerUrl(txid)} target="_new">
          View on Solana Explorer
        </Link>
      ),
    })

    await connection.confirmTransaction(txid)

    pushNotification({
      severity: 'success',
      message: 'Transaction Confirmed: Mint Options Token',
      link: (
        <Link href={buildSolanaExplorerUrl(txid)} target="_new">
          View on Solana Explorer
        </Link>
      ),
    })

    return txid
  }

  return {
    initializeMarkets,
    markets,
    getMarket,
    getStrikePrices,
    getSizes,
    getDates,
    getMyMarkets,
    mint,
  }
}

export default useOptionsMarkets
