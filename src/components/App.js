import React, { useEffect } from 'react'

import Store from '../context/store'
import Router from './Router'
import useOptionsMarkets from '../hooks/useOptionsMarkets'

const WrappedApp = (props) => {
  return (
    <Store>
      <App {...props} />
    </Store>
  )
}

const App = ({ location, routerContext }) => {
  const { fetchMarketData } = useOptionsMarkets()

  useEffect(() => {
    console.log('Fetching app-wide market data')
    fetchMarketData()
  }, [fetchMarketData])

  return <Router location={location} context={routerContext} />
}

App.defaultProps = {
  location: { pathname: '/' },
  routerContext: {},
}

export default WrappedApp
