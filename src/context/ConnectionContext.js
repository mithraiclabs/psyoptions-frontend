import React, { createContext, useState } from 'react'
import useLocalStorageState from 'use-local-storage-state'
import { getDexProgramKeyByNetwork, networks } from '../utils/networkInfo';

// Default to first network that has a defined program id
const DEFAULT_NETWORK = networks.find(
  (network) => network.programId !== undefined,
)

const ConnectionContext = createContext({})

const ConnectionProvider = ({ children }) => {
  const [endpoint, setEndpoint] = useLocalStorageState(
    'endpoint',
    DEFAULT_NETWORK,
  )
  const [connection, setConnection] = useState({})

  // TODO: move all this into a useReducer() state, get rid of useState() here

  const state = {
    networks,
    connection,
    setConnection,
    endpoint,
    setEndpoint,
    dexProgramId: getDexProgramKeyByNetwork(endpoint.name),
  }

  return (
    <ConnectionContext.Provider value={state}>
      {children}
    </ConnectionContext.Provider>
  )
}

export { ConnectionContext, ConnectionProvider, networks }
