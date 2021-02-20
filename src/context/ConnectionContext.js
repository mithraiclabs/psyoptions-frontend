import React, { createContext, useState } from 'react'
import { clusterApiUrl } from '@solana/web3.js'
import useLocalStorageState from 'use-local-storage-state'

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

const DEFAULT_NETWORK = networks[0]

const ConnectionContext = createContext({})

const ConnectionProvider = ({ children }) => {
  const [endpoint, setEndpoint] = useLocalStorageState(
    'endpoint',
    DEFAULT_NETWORK
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

export { ConnectionContext, ConnectionProvider }
