import { Connection, clusterApiUrl } from '@solana/web3.js'
import { useEffect, useState } from 'react'
import useLocalStorageState from 'use-local-storage-state'

const networks = [
  {
    name: 'Mainnet',
    url: clusterApiUrl('mainnet-beta'),
  },
  {
    name: 'Devnet',
    url: clusterApiUrl('devnet'),
  },
  {
    name: 'Testnet',
    url: clusterApiUrl('testnet'),
  },
  {
    name: 'localhost',
    url: 'http://localhost:8899',
  },
]

const useConnection = () => {
  const [endpoint, setEndpoint] = useLocalStorageState('endpoint', networks[0])
  const [connection, setConnection] = useState({})

  useEffect(() => {
    const cx = new Connection(endpoint.url)
    setConnection(cx)
  }, [endpoint])

  return {
    networks,
    connection,
    endpoint,
    setEndpoint,
  }
}

export default useConnection
