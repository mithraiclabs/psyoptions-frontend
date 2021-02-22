import { useMemo } from 'react'
import useOptionsMarkets from './useOptionsMarkets'
import useOwnedTokenAccounts from './useOwnedTokenAccounts'

/**
 * Get object of open positions keyed by the market key
 *
 * Note that the market key will contain an array of token accounts
 */
const useOpenPositions = () => {
  const { markets } = useOptionsMarkets()
  const ownedTokens = useOwnedTokenAccounts()

  return useMemo(
    () =>
      Object.values(markets).reduce((acc, market) => {
        console.log('market ', market)
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
