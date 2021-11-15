import React, { createContext, useCallback, useState } from 'react';
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

// Default to first network that has a defined program id
const DEFAULT_NETWORK =
  networks.find((network) => network.programId !== undefined) || networks[1];

export const activeNetwork = atom({
  key: 'activeNetwork',
  default: DEFAULT_NETWORK,
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
  endpoint: networks[1], // devnet
  setConnection: () => {},
  setEndpoint: () => {},
  networks,
});

const ConnectionProvider: React.FC = ({ children }) => {
  const countryCode = useCountry();
  const isDisallowed = DISALLOWED_COUNTRIES.includes(countryCode ?? '');
  const [endpoint, setEndpoint] = useRecoilState(activeNetwork);
  setTimeout(() => {
    setEndpoint(
      (isDisallowed
        ? networks.find((network) => network.name === ClusterName.devnet)
        : networks.find((network) => network.programId !== undefined)) ||
        networks[1],
    );
  }, 0);

  const [connection, setConnection] = useState(
    new Connection(endpoint.url, {
      commitment: 'confirmed',
      wsEndpoint: endpoint?.wsEndpoint,
    }),
  );

  const handleSetEndpoint = useCallback((newEndpoint) => {
    // Update both endpoint and connection state valuse in the same function
    // Will prevent extra rerenders of components that depend on both endpoint and connection
    setEndpoint(newEndpoint);
    setConnection(new Connection(newEndpoint.url, 'confirmed'));
  }, []);

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
