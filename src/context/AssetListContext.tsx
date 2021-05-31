import React, { createContext, useEffect, useMemo, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import useConnection from '../hooks/useConnection'
import { getAssetsByNetwork } from '../utils/networkInfo'

type TickerPair = {
  uAssetSymbol?: string
  qAssetSymbol?: string
}

type Asset = {
  decimals: number
  icon: string
  mintAddress: string
  tokenName: string
  tokenSymbol: string
}

type AssetListContext = {
  srmPublicKey: PublicKey | null
  supportedAssets: Asset[]
  setSupportedAssets: React.Dispatch<React.SetStateAction<Asset[]>>
  uAsset: Asset | null
  qAsset: Asset | null
  setUAsset: React.Dispatch<React.SetStateAction<Asset | null>>
  setQAsset: React.Dispatch<React.SetStateAction<Asset | null>>
  assetListLoading: boolean
}

const defaultAssetPairsByNetworkName: Record<string, TickerPair> = {
  Mainnet: {
    uAssetSymbol: 'SOL',
    qAssetSymbol: 'USDC',
  },
  Devnet: {
    uAssetSymbol: 'BTC',
    qAssetSymbol: 'USDC',
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

const AssetListContext = createContext<AssetListContext>({
  srmPublicKey: null,
  supportedAssets: [],
  setSupportedAssets: () => {},
  uAsset: null,
  qAsset: null,
  setUAsset: () => {},
  setQAsset: () => {},
  assetListLoading: true,
})

const AssetListProvider: React.FC = ({ children }) => {
  const { endpoint } = useConnection()
  const [supportedAssets, setSupportedAssets] = useState<Asset[]>([])
  const [uAsset, setUAsset] = useState<Asset | null>(null)
  const [qAsset, setQAsset] = useState<Asset | null>(null)
  const [assetListLoading, setAssetListLoading] = useState(true)
  const srmPublicKey = useMemo(() => {
    const srm = supportedAssets.find((asset) => asset.tokenSymbol === 'SRM')
    return srm ? new PublicKey(srm.mintAddress) : null
  }, [supportedAssets])

  useEffect(() => {
    const setDefaultAssets = (assets: Asset[]) => {
      if (assets && assets.length > 1) {
        const defaultAssetPair =
          defaultAssetPairsByNetworkName[endpoint.name] || {}
        let defaultUAsset: Asset | null = null
        let defaultQAsset: Asset | null = null
        assets.forEach((asset) => {
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
      } else {
        setUAsset(null)
        setQAsset(null)
      }
    }

    const basicAssets = getAssetsByNetwork(endpoint.name) as Asset[]
    setSupportedAssets(basicAssets)
    setDefaultAssets(basicAssets)
    setAssetListLoading(false)
  }, [endpoint.name])

  const value = {
    supportedAssets,
    setSupportedAssets,
    srmPublicKey,
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
