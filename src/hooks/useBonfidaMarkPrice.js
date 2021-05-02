import axios from 'axios'
import { useEffect, useState } from 'react'

let timer

export const useBonfidaMarkPrice = ({ uAsset, qAsset }) => {
  const [markPrice, setMarkPrice] = useState()

  useEffect(() => {
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
          // Do we need too log anything here really?
          // console.log(err)
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
  }, [uAsset, qAsset])

  return markPrice
}
