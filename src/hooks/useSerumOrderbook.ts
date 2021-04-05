import { Market, Orderbook } from '@mithraic-labs/serum'
import { useEffect, useState } from 'react'
import useConnection from './useConnection'
import useSerum from './useSerum'

type Order = {
  price: number
  size: number
}
const depth = 20
export const useSerumOrderBook = (
  key: string,
): {
  asks: Order[]
  bids: Order[]
  loading: boolean
} => {
  const { connection } = useConnection()
  const { serumMarkets } = useSerum()
  const [bids, setBids] = useState([])
  const [asks, setAsks] = useState([])
  const [loading, setLoading] = useState(false)
  const serumMarket = serumMarkets[key]?.serumMarket

  useEffect(() => {
    const market = serumMarket?.market as Market | undefined
    let asksSubscription
    let bidsSubscription
    if (market) {
      // initial load of the orderbook
      ;(async () => {
        setLoading(true)
        const { asks: _asks, bids: _bids } = await serumMarket.getOrderbook()
        setLoading(false)
        setAsks(_asks)
        setBids(_bids)
      })()

      // subscribe to bid/ask on chain updates
      bidsSubscription = connection.onAccountChange(
        market.bidsAddress,
        (bidsAccount) => {
          const book = Orderbook.decode(market, bidsAccount.data)
          const _bids = book
            .getL2(depth)
            .map(([price, size]) => ({ price, size }))
          setBids(_bids)
        },
      )
      asksSubscription = connection.onAccountChange(
        market.asksAddress,
        (asksAccount) => {
          const book = Orderbook.decode(market, asksAccount.data)
          const _asks = book
            .getL2(depth)
            .map(([price, size]) => ({ price, size }))
          setAsks(_asks)
        },
      )
    }

    return () => {
      if (asksSubscription) {
        connection.removeAccountChangeListener(asksSubscription)
      }
      if (bidsSubscription) {
        connection.removeAccountChangeListener(bidsSubscription)
      }
    }
  }, [connection, serumMarket])

  return {
    asks,
    bids,
    loading,
  }
}
