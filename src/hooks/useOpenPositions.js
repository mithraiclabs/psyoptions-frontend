import { useMemo } from 'react'
import useOptionsMarkets from './useOptionsMarkets'
import useOwnedTokenAccounts from './useOwnedTokenAccounts'

import useConnection from './useConnection'
import useWallet from './useWallet'
/**
 * Get object of open positions keyed by the market key
 *
 * Note that the market key will contain an array of token accounts
 */
const useOpenPositions = () => {
  const { connection, endpoint } = useConnection()
  const { markets } = useOptionsMarkets()
  const { wallet, pubKey } = useWallet()

  const ownedTokens = useOwnedTokenAccounts()

  

  return useMemo(
    () => {
      console.log('markets', markets)
      // optionMarketKey = optionMarketDataAddress
      console.log('ownedtokens', ownedTokens)
      const positions = Object.keys(markets).reduce((acc, marketKey) => {
        const accountsWithHoldings = ownedTokens[
          markets[marketKey].optionMintAddress
        ]?.filter((optionTokenAcct) => optionTokenAcct.amount > 0)
        if (accountsWithHoldings?.length) {
          acc[marketKey] = accountsWithHoldings
        }
        return acc
      }, {})
      console.log('positions in memo', positions)
      return positions
    
    },
    [markets, ownedTokens]
  )
}

export default useOpenPositions
