import React, { createContext, useState } from 'react'
import useLocalStorageState from 'use-local-storage-state'
import { networks } from '../utils/networkInfo';

const DEFAULT_NETWORK = networks[0]

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
  }

  return (
    <ConnectionContext.Provider value={state}>
      {children}
    </ConnectionContext.Provider>
  )
}

export { ConnectionContext, ConnectionProvider, networks }
