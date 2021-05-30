import React, { useEffect } from 'react'
import Store from '../context/store'
import useOptionsMarkets from '../hooks/useOptionsMarkets'
import { GraphQLProvider } from './GraphQLProvider'
import Router from './Router'

const WrappedApp = (props) => {
  return (
    <GraphQLProvider>
      <Store>
        <App {...props} />
      </Store>
    </GraphQLProvider>
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
