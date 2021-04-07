import React, { useState, createContext, useContext } from 'react'
import PropTypes from 'prop-types'

const SerumContext = createContext()

export const useSerumContext = () => useContext(SerumContext)

const SerumProvider = ({ children }) => {
  const [serumMarkets, setSerumMarkets] = useState({})

  return (
    <SerumContext.Provider
      value={{
        serumMarkets,
        setSerumMarkets,
      }}
    >
      {children}
    </SerumContext.Provider>
  )
}

SerumProvider.propTypes = {
  children: PropTypes.node,
}

SerumProvider.defaultProps = {
  children: null,
}

export { SerumContext, SerumProvider }
