import React, { createContext, useEffect, useState } from 'react'
import useOptionsMarkets from '../hooks/useOptionsMarkets'
import useOwnedTokenAccounts from '../hooks/useOwnedTokenAccounts'
import useWallet from '../hooks/useWallet'

const OpenPositionsContext = createContext({})

const OpenPositionsProvider = ({ children }) => {
  const { connected } = useWallet()
  const { markets } = useOptionsMarkets()
  const ownedTokens = useOwnedTokenAccounts()
  const [positions, setPositions] = useState({})

  useEffect(() => {
    if (connected) {
      const openPositions = Object.values(markets).reduce((acc, market) => {
        const accountsWithHoldings = ownedTokens[
          market.optionMintAddress
        ]?.filter((optionTokenAcct) => optionTokenAcct.amount > 0)
        if (accountsWithHoldings?.length) {
          acc[market.key] = accountsWithHoldings
        }
        return acc
      }, {})
      setPositions(openPositions)
    }
  }, [connected, markets, ownedTokens])

  return (
    <OpenPositionsContext.Provider value={positions}>
      {children}
    </OpenPositionsContext.Provider>
  )
}

export { OpenPositionsContext, OpenPositionsProvider }
