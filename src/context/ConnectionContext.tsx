import React, { createContext, useState, useEffect, useCallback } from 'react';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import {
  getDexProgramKeyByNetwork,
  getGraphQLUrlByNetwork,
  Network,
  networks,
} from '../utils/networkInfo';
import { useRecoilState } from 'recoil';
import { DISALLOWED_COUNTRIES, useCountry } from '../hooks/useCountry';
import { ClusterName } from '../types';
import { atom } from 'recoil';

// Default to devnet
const DEVNET = networks[1];

export const activeNetwork = atom({
  key: 'activeNetwork',
  default: DEVNET,
});

export type ConnectionContextType = {
  networks: Network[];
  connection: Connection;
  setConnection: React.Dispatch<React.SetStateAction<Connection>>;
  endpoint: Network;
  setEndpoint: React.Dispatch<React.SetStateAction<Network>>;
  dexProgramId?: PublicKey;
  graphQLUrl?: string;
};

const ConnectionContext = createContext<ConnectionContextType>({
  connection: new Connection(clusterApiUrl('devnet')),
  endpoint: DEVNET,
  setConnection: () => {},
  setEndpoint: () => {},
  networks,
});

const ConnectionProvider: React.FC = ({ children }) => {
  const countryCode = useCountry();
  const isDisallowed = DISALLOWED_COUNTRIES.includes(countryCode ?? '');
  const [endpoint, setEndpoint] = useRecoilState(activeNetwork);

  useEffect(() => {
    if (isDisallowed) {
      setEndpoint(DEVNET);
    }
  }, [isDisallowed, setEndpoint]);

  const [connection, setConnection] = useState(
    new Connection(endpoint.url, {
      commitment: 'confirmed',
      wsEndpoint: endpoint?.wsEndpoint,
    }),
  );

  const handleSetEndpoint = useCallback(
    (newEndpoint) => {
      // Update both endpoint and connection state valuse in the same function
      // Will prevent extra rerenders of components that depend on both endpoint and connection
      setEndpoint(newEndpoint);
      setConnection(new Connection(newEndpoint.url, 'confirmed'));
    },
    [setEndpoint],
  );

  useEffect(() => {
    // always set disallowed countries to devnet when on mainnet
    if (isDisallowed && endpoint.name === ClusterName.mainnet) {
      handleSetEndpoint(networks[1]);
    }
  }, [endpoint.name, handleSetEndpoint, isDisallowed]);

  const state: ConnectionContextType = {
    networks,
    connection,
    setConnection,
    endpoint,
    setEndpoint: handleSetEndpoint,
    dexProgramId: getDexProgramKeyByNetwork(endpoint.name),
    graphQLUrl: getGraphQLUrlByNetwork(endpoint.name),
  };

  return (
    <ConnectionContext.Provider value={state}>
      {children}
    </ConnectionContext.Provider>
  );
};

export { ConnectionContext, ConnectionProvider, networks };
