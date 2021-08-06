import { useMemo } from 'react'
import { useQuery } from 'urql'
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
// TODO this should probably be a subscription so the data is automatically streamed to the UI
const query = `query chainMarkets($serumMarketAddresses: [String!]) {
  serum_markets(where: { address: {_in: $serumMarketAddresses } }) {
    latest_price
    change(args: {duration: "24 hours", percentage: true})
    volume
    address
  }
}`

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

  const [{ data }] = useQuery({
    query,
    pause: !serumMarketAddresses.length,
    variables: {
      serumMarketAddresses,
    },
  })

  return useMemo(
    () =>
      data?.serum_markets?.reduce((acc, trackerData) => {
        acc[trackerData.address] = trackerData
        return acc
      }, {}) ?? {},
    [data],
  )
}
