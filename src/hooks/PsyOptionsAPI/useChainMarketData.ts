import { useMemo } from 'react'
import { useSubscription } from 'urql'
import { useSerumContext } from '../../context/SerumContext'
import { ChainRow } from '../../types'

export type TrackerMarketData = {
  // eslint-disable-next-line camelcase
  latest_price: number | null
  change: number | null
  id: number
  address: string
  volume: number | null
}

const subMessage = `subscription chainMarkets($serumMarketAddresses: [String!]) {
  serum_markets(where: { address: {_in: $serumMarketAddresses } }) {
    latest_price
    change(args: {duration: "24 hours", percentage: true})
    volume
    address
  }
}`

const handleSubscription = (messages = [], response) => {
  return (
    response?.serum_markets?.reduce((acc, trackerData) => {
      acc[trackerData.address] = trackerData
      return acc
    }, {}) ?? {}
  )
}

export const useChainMarketData = (
  chain: ChainRow[] | undefined,
): Record<string, TrackerMarketData> => {
  const { serumMarkets } = useSerumContext()
  const serumMarketAddresses = useMemo(
    () =>
      chain?.reduce((acc, chainRow) => {
        const callMarketMeta =
          serumMarkets[chainRow?.call?.serumMarketKey?.toString()]
        const putMarketMeta =
          serumMarkets[chainRow?.put?.serumMarketKey?.toString()]
        if (callMarketMeta?.serumMarket?.address) {
          acc.push(callMarketMeta.serumMarket.address.toString())
        }
        if (putMarketMeta?.serumMarket?.address) {
          acc.push(putMarketMeta.serumMarket.address.toString())
        }
        return acc
      }, []) ?? '[]',
    [chain, serumMarkets],
  )

  const [res] = useSubscription(
    {
      query: subMessage,
      pause: !serumMarketAddresses.length,
      variables: {
        serumMarketAddresses,
      },
    },
    handleSubscription,
  )

  return res.data
}
