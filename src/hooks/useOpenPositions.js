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

  return useMemo(() => {
    const positions = Object.keys(markets).reduce((acc, marketKey) => {
      const accountsWithHoldings = ownedTokens[
        markets[marketKey].optionMintAddress
      ]?.filter((optionTokenAcct) => optionTokenAcct.amount > 0)
      if (accountsWithHoldings?.length) {
        acc[marketKey] = accountsWithHoldings
      }
      return acc
    }, {})
    return positions
  }, [markets, ownedTokens])
}

export default useOpenPositions
