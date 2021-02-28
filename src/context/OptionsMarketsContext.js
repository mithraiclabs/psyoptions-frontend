import React, { useState, createContext } from 'react'
import PropTypes from 'prop-types'

const OptionsMarketsContext = createContext()

const OptionsMarketsProvider = ({ children }) => {
  const [markets, setMarkets] = useState({})

  return (
    <OptionsMarketsContext.Provider value={{ markets, setMarkets }}>
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
