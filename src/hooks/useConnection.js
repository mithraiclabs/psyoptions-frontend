import { Connection } from '@solana/web3.js'
import { useContext, useEffect } from 'react'
import { ConnectionContext } from '../context/ConnectionContext'

const useConnection = () => {
  const {
    networks,
    connection,
    setConnection,
    endpoint,
    setEndpoint,
  } = useContext(ConnectionContext)

  useEffect(() => {
    const cx = new Connection(endpoint.url, 'max')
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
