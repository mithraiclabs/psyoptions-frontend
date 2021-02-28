import React, { createContext, useState } from 'react'
import { clusterApiUrl } from '@solana/web3.js'
import useLocalStorageState from 'use-local-storage-state'

// Note these network values are used for determining the asset list.
// Be sure to update that when modifying the order of this list.
const networks = [
  {
    name: 'Mainnet',
    url: clusterApiUrl('mainnet-beta'),
    programId: process.env.MAINNET_PROGRAM_ID,
  },
  {
    name: 'Devnet',
    url: clusterApiUrl('devnet'),
    programId: process.env.DEVNET_PROGRAM_ID,
  },
  {
    name: 'Testnet',
    url: clusterApiUrl('testnet'),
    programId: process.env.TESTNET_PROGRAM_ID,
  },
  {
    name: 'localhost',
    url: 'http://127.0.0.1:8899',
    programId: process.env.LOCAL_PROGRAM_ID,
  },
]

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
  }

  return (
    <ConnectionContext.Provider value={state}>
      {children}
    </ConnectionContext.Provider>
  )
}

export { ConnectionContext, ConnectionProvider, networks }
