import React, { useEffect } from 'react'
import Store from '../context/store'
import useOptionsMarkets from '../hooks/useOptionsMarkets'
import { GraphQLProvider } from './GraphQLProvider'
import Router from './Router'

const App = ({ location, routerContext, ssrPassword }) => {
  const { packagedMarkets } = useOptionsMarkets()

  useEffect(() => {
    packagedMarkets()
  }, [packagedMarkets])

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

const WrappedApp = (props) => {
  return (
    <GraphQLProvider>
      <Store>
        <App {...props} />
      </Store>
    </GraphQLProvider>
  )
}

export default WrappedApp
