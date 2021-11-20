import React, { useMemo } from 'react';
import { SubscriptionClient } from 'graphql-subscriptions-client';
import {
  createClient,
  defaultExchanges,
  Provider,
  subscriptionExchange,
} from 'urql';
import useConnection from '../hooks/useConnection';

export const GraphQLProvider: React.FC = ({ children }) => {
  const { graphQLUrl } = useConnection();

  const client = useMemo(() => {
    if (!graphQLUrl) {
      return null;
    }
    const subscriptionClient = new SubscriptionClient(
      graphQLUrl.replace('http', 'ws'),
      {
        reconnect: true,
        inactivityTimeout: 30_000,
      },
    );

    return createClient({
      url: graphQLUrl,
      exchanges: [
        ...defaultExchanges,
        subscriptionExchange({
          forwardSubscription(operation) {
            return subscriptionClient.request(operation);
          },
        }),
      ],
    });
  }, [graphQLUrl]);

  if (graphQLUrl) {
    return <Provider value={client}>{children}</Provider>;
  }

  return <>{children}</>;
};
