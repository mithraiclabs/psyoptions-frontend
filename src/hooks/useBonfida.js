import axios from 'axios'
import { useState, useEffect } from 'react'

const useBonfida = ({ uAssetSymbol, qAssetSymbol }) => {
  const [currentPairPrice, setCurrentPairPrice] = useState(0)

  const getPairPrices = async ({ uAssetSymbol, qAssetSymbol }) => {
    const prices = {
      bid: 0,
      ask: 0,
    }

    const res = await axios.get(
      `https://serum-api.bonfida.com/orderbooks/${uAssetSymbol}${qAssetSymbol}`
    )

    const data = res?.data?.data || {}

    prices.bid = data.bids?.[0]?.price || 0
    prices.ask = data.asks?.[0]?.price || 0

    return prices
  }

  useEffect(() => {
    const getPrice = async (uAssetSymbol, qAssetSymbol) => {
      const { bid } = await getPairPrices({
        uAssetSymbol,
        qAssetSymbol,
      })

      setCurrentPairPrice(bid)
    }

    if (uAssetSymbol && qAssetSymbol) {
      getPrice(uAssetSymbol, qAssetSymbol)
    }
  }, [uAssetSymbol, qAssetSymbol])

  return {
    currentPairPrice,
  }
}

export default useBonfida
