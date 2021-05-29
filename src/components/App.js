import { SubscriptionClient } from 'graphql-subscriptions-client'
import React, { useEffect } from 'react'
import {
  createClient,
  defaultExchanges,
  Provider,
  subscriptionExchange,
} from 'urql'
import Store from '../context/store'
import useOptionsMarkets from '../hooks/useOptionsMarkets'
import Router from './Router'

const GRAPHQL_URL = 'http://hasura:8080/v1/graphql'
const subscriptionClient = new SubscriptionClient(
  GRAPHQL_URL.replace('http', 'ws'),
  { reconnect: true },
)
const client = createClient({
  url: GRAPHQL_URL,
  exchanges: [
    ...defaultExchanges,
    subscriptionExchange({
      forwardSubscription(operation) {
        return subscriptionClient.request(operation)
      },
    }),
  ],
})

const WrappedApp = (props) => {
  return (
    <Provider value={client}>
      <Store>
        <App {...props} />
      </Store>
    </Provider>
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
