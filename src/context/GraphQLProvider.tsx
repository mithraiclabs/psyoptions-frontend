import React, { useMemo } from 'react';
import { Client, createClient, defaultExchanges, Provider } from 'urql';
import useConnection from '../hooks/useConnection';

export const GraphQLProvider: React.FC = ({ children }) => {
  const { graphQLUrl } = useConnection();

  const client = useMemo(() => {
    if (!graphQLUrl) {
      return new Client({ url: 'https://localhost:3000' });
    }

    return createClient({
      url: graphQLUrl,
      exchanges: [...defaultExchanges],
    });
  }, [graphQLUrl]);

  if (graphQLUrl) {
    return <Provider value={client}>{children}</Provider>;
  }

  return <>{children}</>;
};
