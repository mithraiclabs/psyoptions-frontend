import { Connection } from '@solana/web3.js'
import { useEffect, useState } from 'react'

const useConnection = () => {
  const [endpoint, setEndpoint] = useState('http://localhost:8899')
  const [connection, setConnection] = useState({})

  useEffect(() => {
    const cx = new Connection(endpoint)
    setConnection(cx)
  }, [endpoint])

  return {
    connection,
    setEndpoint,
  }
}

export default useConnection
