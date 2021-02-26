import React, { createContext, useEffect, useState } from 'react'
import useConnection from '../hooks/useConnection'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { networks } from '../context/ConnectionContext'
import { Connection, PublicKey } from '@solana/web3.js'

const mergeAssetsWithChainData = async (connection, assets) =>
  Promise.all(
    assets.map(async (asset) => {
      const token = new Token(
        connection,
        new PublicKey(asset.mintAddress),
        TOKEN_PROGRAM_ID,
        null
      )
      const mintInfo = await token.getMintInfo()
      asset.decimals = mintInfo.decimals
      return asset
    })
  )

const getAssetsByNetwork = (name) => {
  switch (name) {
    case networks[0].name:
      return TOKENS.mainnet
    case networks[1].name:
      return TOKENS.devnet
    case networks[2].name:
      return TOKENS.testnet
    case networks[3].name:
      try {
        const localnetData = require('../hooks/localnetData.json')
        return localnetData
      } catch (err) {
        console.error('localnet data not found at ./localnetData.json')
        return []
      }
    default:
      return []
  }
}

const SupportedAssetContext = createContext([])

const SupportedAssetProvider = ({ children }) => {
  const { connection, endpoint } = useConnection()
  const [supportedAssets, setSupportedAssets] = useState([])

  useEffect(() => {
    if (!(connection instanceof Connection)) {
      setSupportedAssets([])
      return
    }
    const basicAssets = getAssetsByNetwork(endpoint.name)
    ;(async () => {
      try {
        const mergedAssets = await mergeAssetsWithChainData(
          connection,
          basicAssets
        )
        setSupportedAssets(mergedAssets)
      } catch (error) {
        console.error(error)
        setSupportedAssets([])
      }
    })()
  }, [connection, endpoint.name])

  return (
    <SupportedAssetContext.Provider value={supportedAssets}>
      {children}
    </SupportedAssetContext.Provider>
  )
}

export { SupportedAssetContext, SupportedAssetProvider }
