import React, { createContext, useState, useCallback } from 'react';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import {
  getDexProgramKeyByNetwork,
  getGraphQLUrlByNetwork,
  Network,
  networks,
} from '../utils/networkInfo';
import { useRecoilState } from 'recoil';
import { atom } from 'recoil';

// Default to MAINNET
const MAINNET = networks[0];

export const activeNetwork = atom({
  key: 'activeNetwork',
  default: MAINNET,
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
  endpoint: MAINNET,
  setConnection: () => {},
  setEndpoint: () => {},
  networks,
});

const ConnectionProvider: React.FC = ({ children }) => {
  const [endpoint, setEndpoint] = useRecoilState(activeNetwork);

  const [connection, setConnection] = useState(
    new Connection(endpoint.url, {
      commitment: 'confirmed',
      wsEndpoint: endpoint?.wsEndpoint,
    }),
  );

  const handleSetEndpoint = useCallback(
    (newEndpoint) => {
      // Update both endpoint and connection state values in the same function
      // Will prevent extra rerenders of components that depend on both endpoint and connection
      setEndpoint(newEndpoint);
      setConnection(new Connection(newEndpoint.url, 'confirmed'));
    },
    [setEndpoint],
  );

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
