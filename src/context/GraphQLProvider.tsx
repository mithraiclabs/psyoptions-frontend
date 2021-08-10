import React, { useMemo } from 'react'
import { SubscriptionClient } from 'graphql-subscriptions-client'
import {
  createClient,
  defaultExchanges,
  Provider,
  ssrExchange,
  subscriptionExchange,
} from 'urql'

import { isNode, isBrowser } from '../utils/isNode'
import useConnection from '../hooks/useConnection'

export const GraphQLProvider: React.FC = ({ children }) => {
  const { graphQLUrl } = useConnection()

  const client = useMemo(() => {
    if (!isBrowser || !graphQLUrl) {
      return null
    }
    const subscriptionClient = new SubscriptionClient(
      graphQLUrl.replace('http', 'ws'),
      { reconnect: true },
    )

    // The `ssrExchange` must be initialized with `isClient` and `initialState`
    const ssr = ssrExchange({
      isClient: !isNode,
      initialState: !isNode ? window.__URQL_DATA__ : undefined,
    })

    return createClient({
      url: graphQLUrl,
      exchanges: [
        ssr,
        ...defaultExchanges,
        subscriptionExchange({
          forwardSubscription(operation) {
            return subscriptionClient.request(operation)
          },
        }),
      ],
    })
  }, [graphQLUrl])

  if (isBrowser && graphQLUrl) {
    return <Provider value={client}>{children}</Provider>
  }

  return <>{children}</>
}
