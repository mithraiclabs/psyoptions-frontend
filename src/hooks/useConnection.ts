import { Connection, PublicKey } from '@solana/web3.js'
import React, { useContext } from 'react'
import { ConnectionContext } from '../context/ConnectionContext'

type Network = {
  name: string
  url: string
  programId: string
}
type ConnectionContext = {
  networks: Network[]
  connection: Connection
  endpoint: Network
  setEndpoint: React.SetStateAction<Network>
  dexProgramId: PublicKey
}
const useConnection = (): ConnectionContext => {
  const {
    networks,
    connection,
    endpoint,
    setEndpoint,
    dexProgramId,
  } = useContext(ConnectionContext) as ConnectionContext

  return {
    networks,
    connection,
    endpoint,
    setEndpoint,
    dexProgramId,
  }
}

export default useConnection
