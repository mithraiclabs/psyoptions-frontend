import { Market } from '@mithraic-labs/serum'
import { useEffect, useState } from 'react'
import {
  Orderbook,
  useSerumOrderbooks,
} from '../../context/SerumOrderbookContext'
import useConnection from '../useConnection'
import useSerum from '../useSerum'

/**
 * Fetch and return serum orderbook for specific market
 */
export const useSerumOrderbook = (
  key: string,
): {
  orderbook: Orderbook | undefined
  loading: boolean
} => {
  const { connection } = useConnection()
  const { serumMarkets } = useSerum()
  const [loading, setLoading] = useState(false)
  const [orderbooks, setOrderbooks] = useSerumOrderbooks()
  const serumMarket = serumMarkets[key]?.serumMarket

  useEffect(() => {
    const market = serumMarket?.market as Market | undefined
    if (market) {
      // initial load of the orderbook
      ;(async () => {
        setLoading(true)
        const { asks: _asks, bids: _bids } = await serumMarket.getOrderbook()
        setOrderbooks((prevOrderbooks) => ({
          ...prevOrderbooks,
          [key]: {
            asks: _asks,
            bids: _bids,
          },
        }))
        setLoading(false)
      })()
    }
  }, [connection, key, serumMarket, setOrderbooks])

  return {
    orderbook: orderbooks[key],
    loading,
  }
}
