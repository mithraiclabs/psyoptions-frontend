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
): OpenOrders[] | undefined => {
  const { connection } = useConnection()
  const { serumMarkets } = useSerum()
  const { pubKey } = useWallet()
  const [serumOpenOrders, setSerumOpenOrders] = useSerumOpenOrders()
  const serumMarket = serumMarkets[key]?.serumMarket

  useEffect(() => {
    const market = serumMarket?.market as Market | undefined
    if (market) {
      ;(async () => {
        const openOrders = await market.findOpenOrdersAccountsForOwner(
          connection,
          pubKey,
        )
        setSerumOpenOrders((prevSerumOpenOrders) => ({
          ...prevSerumOpenOrders,
          [key]: openOrders,
        }))
      })()
    }
  }, [connection, key, pubKey, serumMarket?.market, setSerumOpenOrders])

  return serumOpenOrders[key]
}
