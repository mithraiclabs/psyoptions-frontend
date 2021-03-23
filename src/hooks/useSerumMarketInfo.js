import { PublicKey } from '@solana/web3.js'
import { useState, useEffect } from 'react'
import { SerumMarket } from '../utils/serum'
import useConnection from './useConnection'

const useSerumMarketInfo = ({ uAssetMint, qAssetMint }) => {
  const [currentPairPrice, setCurrentPairPrice] = useState(0)
  const { connection } = useConnection()

  const getPairPrices = async ({ _uAssetMint, _qAssetMint }) => {
    const serumMarkets = await SerumMarket.getMarketByAssetKeys(
      connection,
      new PublicKey(_uAssetMint),
      new PublicKey(_qAssetMint),
    )
    const serumMarketAddress = serumMarkets[0].publicKey
    const serumMarket = new SerumMarket(connection, serumMarketAddress)
    await serumMarket.initMarket()

    const prices = await serumMarket.getBidAskSpread()
    return prices
  }

  useEffect(() => {
    const getPrice = async (_uAssetMint, _qAssetMint) => {
      const { bid } = await getPairPrices({
        _uAssetMint,
        _qAssetMint,
      })

      setCurrentPairPrice(bid)
    }

    if (uAssetMint && qAssetMint) {
      getPrice(uAssetMint, qAssetMint)
    }
  }, [uAssetMint, qAssetMint]) // eslint-disable-line

  return {
    marketPrice: currentPairPrice,
  }
}

export default useSerumMarketInfo
