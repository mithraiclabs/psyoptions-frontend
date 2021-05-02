import axios from 'axios'
import { useEffect, useState } from 'react'
import useNotifications from './useNotifications'

export const useBonfidaMarkPrice = ({ uAsset, qAsset }) => {
  const [markPrice, setMarkPrice] = useState(0)
  const { pushNotification } = useNotifications()

  useEffect(() => {
    let timer
    if (uAsset?.tokenSymbol && qAsset?.tokenSymbol) {
      const fetchPrice = async () => {
        try {
          const resp = await axios.get(
            `https://serum-api.bonfida.com/orderbooks/${uAsset?.tokenSymbol}${qAsset?.tokenSymbol}`,
          )
          const highestBid = resp?.data?.data?.bids[0]?.price
          const lowestAsk = resp?.data?.data?.asks[0]?.price
          if (highestBid && lowestAsk) {
            setMarkPrice((highestBid + lowestAsk) / 2)
          } else {
            setMarkPrice(0)
          }
        } catch (err) {
          pushNotification({
            severity: 'error',
            message: `Couldn't load market price for ${uAsset?.tokenSymbol}`,
          })
          console.error({
            ...err,
          })
        }
      }

      if (timer) {
        clearInterval(timer)
      }

      timer = setInterval(fetchPrice, 10000)
      fetchPrice()
    }

    return () => {
      clearInterval(timer)
    }
  }, [uAsset, qAsset, pushNotification])

  return markPrice
}
