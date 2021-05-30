import { useMemo } from 'react'
import { useQuery } from 'urql'
import { ChainRow } from '../useOptionsChain'

const query = `query chainMarkets($serumMarketIds: [String!]) {
  markets(where: { serum_address: {_in: $serumMarketIds } }) {
    id
    change(args: {duration: "24 hours", percentage: true})
    volume
    serum_address
  }
}`

export const useChainMarketData = (chain: ChainRow[] | undefined): any => {
  const serumMarketIds = useMemo(
    () =>
      chain?.reduce((acc, chainRow) => {
        if (chainRow?.call?.serumKey) {
          acc.push(chainRow.call.serumKey)
        }
        if (chainRow?.put?.serumKey) {
          acc.push(chainRow.put.serumKey)
        }
        return acc
      }, []) ?? '[]',
    [chain],
  )

  const [result] = useQuery({
    query,
    variables: {
      serumMarketIds,
    },
  })
  // TODO remove and handle response
  console.log('Result ', result, serumMarketIds)
}
