import { useContext } from 'react'
import { ConnectionContext } from '../context/ConnectionContext'

const useConnection = () => {
  const {
    networks,
    connection,
    endpoint,
    graphQLUrl,
    setEndpoint,
    dexProgramId,
  } = useContext(ConnectionContext)

  return {
    networks,
    connection,
    endpoint,
    setEndpoint,
    dexProgramId,
    graphQLUrl,
  }
}

export default useConnection
