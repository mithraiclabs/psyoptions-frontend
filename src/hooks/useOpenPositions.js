import { useMemo } from 'react'
import useOptionsMarkets from './useOptionsMarkets'
import useOwnedTokenAccounts from './useOwnedTokenAccounts'

const useOpenPositions = () => {
  const { markets } = useOptionsMarkets()
  const ownedTokens = useOwnedTokenAccounts()

  return useMemo(
    () =>
      Object.values(markets).reduce((acc, market) => {
        const accountsWithHoldings = ownedTokens[
          market.optionMintAddress
        ]?.filter((optionTokenAcct) => optionTokenAcct.amount > 0)
        if (accountsWithHoldings?.length) {
          acc[market.key] = accountsWithHoldings
        }
        return acc
      }, {}),
    [markets, ownedTokens]
  )
}

export default useOpenPositions
