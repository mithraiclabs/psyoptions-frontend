import { useMemo } from 'react'
import { useQuery } from 'urql'
import { useSerumContext } from '../../context/SerumContext'
import { ChainRow } from '../useOptionsChain'

export type TrackerMarketData = {
  change: number | null
  id: number
  // eslint-disable-next-line camelcase
  serum_address: string
  volume: number | null
}

const query = `query chainMarkets($serumMarketIds: [String!]) {
  markets(where: { serum_address: {_in: $serumMarketIds } }) {
    id
    change(args: {duration: "24 hours", percentage: true})
    volume
    serum_address
  }
}`

export const useChainMarketData = (
  chain: ChainRow[] | undefined,
): Record<string, TrackerMarketData> => {
  const { serumMarkets } = useSerumContext()
  const serumMarketIds = useMemo(
    () =>
      chain?.reduce((acc, chainRow) => {
        const callMarketMeta = serumMarkets[chainRow?.call?.serumKey]
        const putMarketMeta = serumMarkets[chainRow?.put?.serumKey]
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
    pause: !serumMarketIds.length,
    variables: {
      serumMarketIds,
    },
  })

  return useMemo(
    () =>
      data?.markets?.reduce((acc, trackerData) => {
        acc[trackerData.serum_address] = trackerData
        return acc
      }, {}) ?? {},
    [data],
  )
}
