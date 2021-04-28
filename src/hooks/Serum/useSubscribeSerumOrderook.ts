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
    const market = serumMarket?.market as Market | undefined
    let asksSubscription
    let bidsSubscription
    if (market) {
      // subscribe to bid/ask on chain updates
      bidsSubscription = connection.onAccountChange(
        market.bidsAddress,
        (bidsAccount) => {
          const book = Orderbook.decode(market, bidsAccount.data)
          const _bids = book
            .getL2(DEFAULT_DEPTH)
            .map(([price, size]) => ({ price, size }))
          setOrderbooks((prevOrderbooks) => ({
            ...prevOrderbooks,
            [key]: {
              // TODO do we need to update the raw orderbook data here
              // And is it possible to even do? Maybe not cuz we're not subscribing to the whole orderbook's changes... ugh
              askOrderbook: prevOrderbooks[key]?.askOrderbook,
              bidOrderbook: prevOrderbooks[key]?.bidOrderbook,
              asks: prevOrderbooks[key]?.asks ?? [],
              bids: _bids,
            },
          }))
        },
      )
      asksSubscription = connection.onAccountChange(
        market.asksAddress,
        (asksAccount) => {
          const book = Orderbook.decode(market, asksAccount.data)
          const _asks = book
            .getL2(DEFAULT_DEPTH)
            .map(([price, size]) => ({ price, size }))
          setOrderbooks((prevOrderbooks) => ({
            ...prevOrderbooks,
            [key]: {
              askOrderbook: prevOrderbooks[key]?.askOrderbook,
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
