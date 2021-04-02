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
    uAssetSymbol: 'BTC',
    qAssetSymbol: 'USDC',
  },
}

// TODO see if we can query many accounts at once
const mergeAssetsWithChainData = async (connection: Connection, assets) =>
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
  const [assetListLoading, setAssetListLoading] = useState(true)
  const { pushNotification } = useNotifications()

  useEffect(() => {
    if (!(connection instanceof Connection)) {
      setSupportedAssets([])
      return
    }

    const setDefaultAssets = (assets) => {
      if (assets && assets.length > 1) {
        const defaultAssetPair =
          defaultAssetPairsByNetworkName[endpoint.name] || {}
        let defaultUAsset
        let defaultQAsset
        assets.forEach((asset) => {
          if (asset.tokenSymbol === defaultAssetPair.uAssetSymbol) {
            defaultUAsset = asset
          }
          if (asset.tokenSymbol === defaultAssetPair.qAssetSymbol) {
            defaultQAsset = asset
          }
        })
        if (defaultUAsset && defaultQAsset) {
          console.log('ASSETS ', defaultUAsset)
          setUAsset(defaultUAsset)
          setQAsset(defaultQAsset)
        }
      } else {
        setUAsset(null)
        setQAsset(null)
      }
    }

    const loadAssets = async (basicAssets) => {
      setAssetListLoading(true)
      try {
        const mergedAssets = await mergeAssetsWithChainData(
          connection,
          basicAssets,
        )
        const loadedAssets = mergedAssets
          .filter((res) => {
            if (res.status === 'rejected') {
              // We could put a notificatiomn here but it would really fill up the screen if there were multiple failures
              console.error(res.reason)
              return false
            }
            return true
          })
          .map((res) => res.value)
        setSupportedAssets(loadedAssets)
        setDefaultAssets(loadedAssets)
        setAssetListLoading(false)
      } catch (error) {
        pushNotification({
          severity: 'error',
          message: `${error}`,
        })
        console.error(error)
        setAssetListLoading(false)
        setSupportedAssets([])
      }
    }

    const basicAssets = getAssetsByNetwork(endpoint.name)
    loadAssets(basicAssets)
  }, [connection, endpoint.name, pushNotification])

  const value = {
    supportedAssets,
    setSupportedAssets,
    uAsset,
    qAsset,
    setUAsset,
    setQAsset,
    assetListLoading,
  }

  return (
    <AssetListContext.Provider value={value}>
      {children}
    </AssetListContext.Provider>
  )
}

export { AssetListContext, AssetListProvider }
