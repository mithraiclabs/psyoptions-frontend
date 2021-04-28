import { Market, OpenOrders } from '@mithraic-labs/serum'
import { useEffect } from 'react'
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext'
import useConnection from '../useConnection'
import useSerum from '../useSerum'
import useWallet from '../useWallet'

/**
 * Fetch and return wallet's open orders for a given serum market
 */
export const useSerumOpenOrderAccounts = (
  key: string,
  skipFetch = false,
): OpenOrders[] | undefined => {
  const { connection } = useConnection()
  const { serumMarkets } = useSerum()
  const { pubKey } = useWallet()
  const [serumOpenOrders, setSerumOpenOrders] = useSerumOpenOrders()
  const serumMarket = serumMarkets[key]?.serumMarket

  useEffect(() => {
    const market = serumMarket?.market as Market | undefined
    if (market && !skipFetch) {
      ;(async () => {
        const openOrders = await market.findOpenOrdersAccountsForOwner(
          connection,
          pubKey,
        )
        setSerumOpenOrders((prevSerumOpenOrders) => ({
          ...prevSerumOpenOrders,
          [key]: {
            error: null,
            loading: false,
            orders: openOrders,
          },
        }))
      })()
    }
  }, [
    connection,
    key,
    pubKey,
    serumMarket?.market,
    setSerumOpenOrders,
    skipFetch,
  ])

  return serumOpenOrders[key]?.orders
}
