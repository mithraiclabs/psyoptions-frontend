import React, { useState, createContext } from 'react'
import PropTypes from 'prop-types'

import { OptionMarket } from '../types'

const OptionsMarketsContext = createContext({
  markets: {},
  setMarkets: null,
  marketsLoading: false,
  setMarketsLoading: null,
})

const OptionsMarketsProvider = ({ children }) => {
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

OptionsMarketsProvider.propTypes = {
  children: PropTypes.node,
}

OptionsMarketsProvider.defaultProps = {
  children: null,
}

export { OptionsMarketsContext, OptionsMarketsProvider }
