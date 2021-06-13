import React, { useMemo } from 'react'
import { SubscriptionClient } from 'graphql-subscriptions-client'
import {
  createClient,
  defaultExchanges,
  Provider,
  subscriptionExchange,
} from 'urql'

import { isBrowser } from '../utils/isNode'

export const GraphQLProvider: React.FC = ({ children }) => {
  const client = useMemo(() => {
    if (!isBrowser || !process.env.GRAPHQL_URL) {
      return null
    }
    const subscriptionClient = new SubscriptionClient(
      process.env.GRAPHQL_URL.replace('http', 'ws'),
      { reconnect: true },
    )
    return createClient({
      url: process.env.GRAPHQL_URL,
      exchanges: [
        ...defaultExchanges,
        subscriptionExchange({
          forwardSubscription(operation) {
            return subscriptionClient.request(operation)
          },
        }),
      ],
    })
  }, [])

  if (isBrowser && process.env.GRAPHQL_URL) {
    return <Provider value={client}>{children}</Provider>
  }

  return <>{children}</>
}
