import { Market } from '@mithraic-labs/serum'
import { useEffect, useState } from 'react'
import { getOrderbook } from '../../utils/serum'
import {
  OrderbookData,
  useSerumOrderbooks,
} from '../../context/SerumOrderbookContext'
import useConnection from '../useConnection'
import useNotifications from '../useNotifications'
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
  const { pushNotification } = useNotifications()
  const { connection } = useConnection()
  const { serumMarkets } = useSerum()
  const [loading, setLoading] = useState(false)
  const [orderbooks, setOrderbooks] = useSerumOrderbooks()
  const serumMarket = serumMarkets[key]?.serumMarket

  useEffect(() => {
    if (serumMarket) {
      // initial load of the orderbook
      ;(async () => {
        setLoading(true)
        try {
          // We now batch load orderbooks, so there's likely no need to fetch again
          // if we successfully load and subscribe
          if (!orderbooks[key]) {
            console.log('*** loading individual orderbook')
            const {
              asks: _asks,
              bids: _bids,
              bidOrderbook,
              askOrderbook,
            } = await getOrderbook(connection, serumMarket)
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
          }
        } catch (err) {
          pushNotification({
            severity: 'error',
            message: `${err}`,
          })
        } finally {
          setLoading(false)
        }
      })()
    }
  }, [
    connection,
    key,
    orderbooks,
    pushNotification,
    serumMarket,
    setOrderbooks,
  ])

  return {
    orderbook: orderbooks[key],
    loading,
  }
}
