import React, { createContext, useEffect, useState } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import useConnection from '../hooks/useConnection'
import useNotifications from '../hooks/useNotifications'
import { getAssetsByNetwork } from '../utils/networkInfo'

const defaultAssetPairsByNetworkName = {
  Mainnet: {
    uAssetSymbol: 'SOL',
    qAssetSymbol: 'USDC',
  },
  Devnet: {
    uAssetSymbol: 'PSYA',
    qAssetSymbol: 'USDCT', // TODO add this
  },
  Testnet: {
    uAssetSymbol: 'SOL',
    qAssetSymbol: 'ABC',
  },
  localhost: {
    uAssetSymbol: 'SRM',
    qAssetSymbol: 'USDC',
  },
}

// TODO see if we can query many accounts at once
const mergeAssetsWithChainData = async (connection, assets) =>
  Promise.allSettled(
    assets.map(async (a) => {
      const asset = a
      const token = new Token(
        connection,
        new PublicKey(a.mintAddress),
        TOKEN_PROGRAM_ID,
        null,
      )
      const mintInfo = await token.getMintInfo()
      asset.decimals = mintInfo.decimals
      return asset
    }),
  )

const AssetListContext = createContext([])

const AssetListProvider = ({ children }) => {
  const { connection, endpoint } = useConnection()
  const [supportedAssets, setSupportedAssets] = useState([])
  const [uAsset, setUAsset] = useState()
  const [qAsset, setQAsset] = useState()
  const { pushNotification } = useNotifications()

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
          basicAssets,
        )
        setSupportedAssets(
          mergedAssets
            .filter((res) => {
              if (res.status === 'rejected') {
                // We could put a notificatiomn here but it would really fill up the screen if there were multiple failures
                console.error(res.reason)
                return false
              }
              return true
            })
            .map((res) => res.value),
        )
      } catch (error) {
        pushNotification({
          severity: 'error',
          message: `${error}`,
        })
        console.error(error)
        setSupportedAssets([])
      }
    })()
  }, [connection, endpoint.name, pushNotification])

  // Set default assets on mount if there are no assets selected and supported assets are available
  useEffect(() => {
    if (supportedAssets && supportedAssets.length > 0 && !uAsset && !qAsset) {
      const defaultAssetPair =
        defaultAssetPairsByNetworkName[endpoint.name] || {}
      let defaultUAsset
      let defaultQAsset
      supportedAssets.forEach((asset) => {
        if (asset.tokenSymbol === defaultAssetPair.uAssetSymbol) {
          defaultUAsset = asset
        }
        if (asset.tokenSymbol === defaultAssetPair.qAssetSymbol) {
          defaultQAsset = asset
        }
      })
      if (defaultUAsset && defaultQAsset) {
        setUAsset(defaultUAsset)
        setQAsset(defaultQAsset)
      }
    }
  }, [endpoint, supportedAssets, uAsset, qAsset]) // eslint-disable-line

  const value = {
    supportedAssets,
    uAsset,
    qAsset,
    setUAsset,
    setQAsset,
  }

  return (
    <AssetListContext.Provider value={value}>
      {children}
    </AssetListContext.Provider>
  )
}

export { AssetListContext, AssetListProvider }
