import React, { useState, createContext } from 'react'

import { OptionMarket } from '../types'

const OptionsMarketsContext = createContext<{
  markets: Record<string, OptionMarket>
  setMarkets: React.Dispatch<React.SetStateAction<Record<string, OptionMarket>>>
  marketsLoading: boolean
  setMarketsLoading: React.Dispatch<React.SetStateAction<boolean>>
}>({
  markets: {},
  setMarkets: null,
  marketsLoading: false,
  setMarketsLoading: null,
})

const OptionsMarketsProvider: React.FC = ({ children }) => {
  const [markets, setMarkets] = useState<Record<string, OptionMarket>>({})
  const [marketsLoading, setMarketsLoading] = useState(false)

  return (
    <OptionsMarketsContext.Provider
      value={{
        markets,
        setMarkets,
        marketsLoading,
        setMarketsLoading,
      }}
    >
      {children}
    </OptionsMarketsContext.Provider>
  )
}

export { OptionsMarketsContext, OptionsMarketsProvider }
