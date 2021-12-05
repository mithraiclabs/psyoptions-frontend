import React, { createContext, useMemo } from 'react';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import {
  getDexProgramKeyByNetwork,
  getGraphQLUrlByNetwork,
  Network,
  networks,
} from '../utils/networkInfo';
import { useRecoilValue } from 'recoil';
import { activeNetwork } from '../recoil';

// Default to MAINNET
const MAINNET = networks[0];

export type ConnectionContextType = {
  networks: Network[];
  connection: Connection;
  endpoint: Network;
  dexProgramId?: PublicKey;
  graphQLUrl?: string;
};

const ConnectionContext = createContext<ConnectionContextType>({
  connection: new Connection(clusterApiUrl('devnet')),
  endpoint: MAINNET,
  networks,
});

const ConnectionProvider: React.FC = ({ children }) => {
  const endpoint = useRecoilValue(activeNetwork);
  const connection = useMemo(() => {
    return new Connection(endpoint.url, {
      commitment: 'confirmed',
      wsEndpoint: endpoint?.wsEndpoint,
    });
  }, [endpoint.url, endpoint?.wsEndpoint]);

  const state: ConnectionContextType = {
    networks,
    connection,
    endpoint,
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
