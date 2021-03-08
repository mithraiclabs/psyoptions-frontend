import React, { useState, createContext } from 'react'
import PropTypes from 'prop-types'

const OptionsChainContext = createContext()

const OptionsChainProvider = ({ children }) => {
  const [chain, setChain] = useState([])
  const [loading, setLoading] = useState(false)

  return (
    <OptionsChainContext.Provider value={{ chain, setChain, loading, setLoading }}>
      {children}
    </OptionsChainContext.Provider>
  )
}

OptionsChainProvider.propTypes = {
  children: PropTypes.node,
}

OptionsChainProvider.defaultProps = {
  children: null,
}

export { OptionsChainContext, OptionsChainProvider }
