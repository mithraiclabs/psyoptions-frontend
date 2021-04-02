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

const App = ({ location, routerContext, ssrPassword }) => {
  const { fetchMarketData } = useOptionsMarkets()

  useEffect(() => {
    fetchMarketData()
  }, [fetchMarketData])

  return (
    <Router
      location={location}
      context={routerContext}
      ssrPassword={ssrPassword}
    />
  )
}

App.defaultProps = {
  location: { pathname: '/' },
  routerContext: {},
}

export default WrappedApp
