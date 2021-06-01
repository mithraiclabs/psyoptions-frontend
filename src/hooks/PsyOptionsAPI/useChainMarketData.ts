import { useMemo } from 'react'
import { useQuery } from 'urql'
import { useSerumContext } from '../../context/SerumContext'
import { ChainRow } from '../useOptionsChain'

const query = `query chainMarkets($serumMarketIds: [String!]) {
  markets(where: { serum_address: {_in: $serumMarketIds } }) {
    id
    change(args: {duration: "24 hours", percentage: true})
    volume
    serum_address
  }
}`

// TODO refactor serumMarket.marketAddress to public key
export const useChainMarketData = (chain: ChainRow[] | undefined): any => {
  const { serumMarkets } = useSerumContext()
  const serumMarketIds = useMemo(
    () =>
      chain?.reduce((acc, chainRow) => {
        const callMarketMeta = serumMarkets[chainRow?.call?.serumKey]
        const putMarketMeta = serumMarkets[chainRow?.put?.serumKey]
        if (callMarketMeta?.serumMarket?.marketAddress) {
          acc.push(callMarketMeta.serumMarket.marketAddress.toString())
        }
        if (putMarketMeta?.serumMarket?.marketAddress) {
          acc.push(putMarketMeta.serumMarket.marketAddress.toString())
        }
        return acc
      }, []) ?? '[]',
    [chain, serumMarkets],
  )

  const [{ data }] = useQuery({
    query,
    variables: {
      serumMarketIds,
    },
  })

  return data
}
