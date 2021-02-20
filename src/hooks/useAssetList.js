import { TOKENS } from '@project-serum/tokens'
import { networks } from '../context/ConnectionContext'
import useConnection from './useConnection'

const useAssetList = () => {
  const { endpoint } = useConnection()

  switch (endpoint.name) {
    case networks[0].name:
      return TOKENS.mainnet
    case networks[1].name:
      return TOKENS.devnet
    case networks[2].name:
      return TOKENS.testnet
    case networks[3].name:
      try {
        const localnetData = require('../../localnetData.json')
        return localnetData
      } catch (err) {
        console.error('localnet data not found at ../../localnetData.json')
        return []
      }
    default:
      return []
  }
}

export default useAssetList
