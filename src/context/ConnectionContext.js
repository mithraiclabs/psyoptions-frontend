import React, { createContext, useState } from 'react'
import { Connection } from '@solana/web3.js'

import { getDexProgramKeyByNetwork, networks } from '../utils/networkInfo'

// Default to first network that has a defined program id
const DEFAULT_NETWORK = networks.find(
  (network) => network.programId !== undefined,
)

const ConnectionContext = createContext({})

const ConnectionProvider = ({ children }) => {
  const [endpoint, setEndpoint] = useState(DEFAULT_NETWORK)

  const [connection, setConnection] = useState(
    new Connection(endpoint.url, 'confirmed'),
  )

  const handleSetEndpoint = (newEndpoint) => {
    // Update both endpoint and connection state valuse in the same function
    // Will prevent extra rerenders of components that depend on both endpoint and connection
    setEndpoint(newEndpoint)
    setConnection(new Connection(newEndpoint.url, 'confirmed'))
  }

  const state = {
    networks,
    connection,
    setConnection,
    endpoint,
    setEndpoint: handleSetEndpoint,
    dexProgramId: getDexProgramKeyByNetwork(endpoint.name),
  }

  return (
    <ConnectionContext.Provider value={state}>
      {children}
    </ConnectionContext.Provider>
  )
}

export { ConnectionContext, ConnectionProvider, networks }
