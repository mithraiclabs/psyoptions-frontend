import { Market, Orderbook } from '@mithraic-labs/serum'
import { useEffect } from 'react'
import {
  DEFAULT_DEPTH,
  useSerumOrderbooks,
} from '../../context/SerumOrderbookContext'
import useConnection from '../useConnection'
import useSerum from '../useSerum'

/**
 * Handle subscription to serum orderbook updates for a specific market.
 *
 * Subscribes on mount
 */
export const useSubscribeSerumOrderbook = (key: string): void => {
  const { connection } = useConnection()
  const { serumMarkets } = useSerum()
  const [, setOrderbooks] = useSerumOrderbooks()
  const serumMarket = serumMarkets[key]?.serumMarket

  useEffect(() => {
    let asksSubscription
    let bidsSubscription
    if (serumMarket) {
      // subscribe to bid/ask on chain updates
      bidsSubscription = connection.onAccountChange(
        serumMarket.bidsAddress,
        (bidsAccount) => {
          const book = Orderbook.decode(serumMarket, bidsAccount.data)
          const _bids = book
            .getL2(DEFAULT_DEPTH)
            .map(([price, size]) => ({ price, size }))
          setOrderbooks((prevOrderbooks) => ({
            ...prevOrderbooks,
            [key]: {
              askOrderbook: prevOrderbooks[key]?.askOrderbook,
              bidOrderbook: book,
              asks: prevOrderbooks[key]?.asks ?? [],
              bids: _bids,
            },
          }))
        },
      )
      asksSubscription = connection.onAccountChange(
        serumMarket.asksAddress,
        (asksAccount) => {
          const book = Orderbook.decode(serumMarket, asksAccount.data)
          const _asks = book
            .getL2(DEFAULT_DEPTH)
            .map(([price, size]) => ({ price, size }))
          setOrderbooks((prevOrderbooks) => ({
            ...prevOrderbooks,
            [key]: {
              askOrderbook: book,
              bidOrderbook: prevOrderbooks[key]?.bidOrderbook,
              asks: _asks,
              bids: prevOrderbooks[key]?.bids ?? [],
            },
          }))
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
  }, [connection, key, serumMarket, setOrderbooks])
}
