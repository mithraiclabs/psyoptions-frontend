import { Market } from '@mithraic-labs/serum'
import { useEffect, useState } from 'react'
import {
  OrderbookData,
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
  orderbook: OrderbookData | undefined
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
        const {
          asks: _asks,
          bids: _bids,
          bidOrderbook,
          askOrderbook,
        } = await serumMarket.getOrderbook()
        setOrderbooks((prevOrderbooks) => ({
          ...prevOrderbooks,
          [key]: {
            // bidOrderbook and askOrderbook are the raw orderbook objects that come back from serum-ts
            // These are not useable for displaying orders,
            // But are needed for some other functionality such as finding open orders for an account
            bidOrderbook,
            askOrderbook,

            // These are the human-readable orderbooks used to display data in the orderbook table
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
