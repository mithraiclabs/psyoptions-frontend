import React, { useState, useCallback, useMemo, createContext } from 'react'

const OptionsMarketsContext = createContext()

const OptionsMarketsProvider = ({ children }) => {
  const [markets, setMarkets] = useState({})

  return (
    <OptionsMarketsContext.Provider value={{ markets, setMarkets }}>
      {children}
    </OptionsMarketsContext.Provider>
  )
}

export { OptionsMarketsContext, OptionsMarketsProvider }
