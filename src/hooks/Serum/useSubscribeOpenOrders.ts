import { OpenOrders } from '@mithraic-labs/serum'
import { useEffect } from 'react'
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext'
import useConnection from '../useConnection'

/**
 * Handle subscriptions to serum OpenOrders for given market key
 */
export const useSubscribeOpenOrders = (key: string): void => {
  const { connection, dexProgramId } = useConnection()
  const [serumOpenOrders, setSerumOpenOrders] = useSerumOpenOrders()
  const openOrders = serumOpenOrders[key]

  useEffect(() => {
    let subscriptions: number[]
    if (openOrders) {
      subscriptions = openOrders.map((openOrder) =>
        connection.onAccountChange(openOrder.address, (accountInfo) => {
          const _openOrder = OpenOrders.fromAccountInfo(
            openOrder.address,
            accountInfo,
            dexProgramId,
          )
          setSerumOpenOrders((prevSerumOpenOrders) => {
            // find the index of the OpenOrders instance that should be replaced
            const index = prevSerumOpenOrders[key]?.findIndex((prevOpenOrder) =>
              prevOpenOrder.address.equals(openOrder.address),
            )
            // immutably replace the OpenOrders instance with the matching address
            const updatedOpenOrders = Object.assign(
              [],
              prevSerumOpenOrders[key],
              {
                [index]: _openOrder,
              },
            )
            return {
              ...prevSerumOpenOrders,
              [key]: updatedOpenOrders,
            }
          })
        }),
      )
    }
    return () => {
      if (subscriptions) {
        subscriptions.forEach((sub) =>
          connection.removeAccountChangeListener(sub),
        )
      }
    }
  }, [connection, dexProgramId, key, openOrders, setSerumOpenOrders])
}
