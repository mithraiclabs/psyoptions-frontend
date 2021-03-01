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
    dexProgramId,
  } = useContext(ConnectionContext)

  useEffect(() => {
    const cx = new Connection(endpoint.url, 'confirmed')
    setConnection(cx)
  }, [endpoint, setConnection])

  return {
    networks,
    connection,
    endpoint,
    setEndpoint,
    dexProgramId,
  }
}

export default useConnection
