import React, { createContext, useEffect, useMemo, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { Token } from '@mithraic-labs/market-meta/dist/types'
import useConnection from '../hooks/useConnection'
import { getAssetsByNetwork } from '../utils/networkInfo'

type TickerPair = {
  uAssetSymbol?: string
  qAssetSymbol?: string
}

type AssetListContext = {
  srmPublicKey: PublicKey | null
  USDCPublicKey: PublicKey | null
  supportedAssets: Token[]
  setSupportedAssets: React.Dispatch<React.SetStateAction<Token[]>>
  uAsset: Token | null
  qAsset: Token | null
  setUAsset: React.Dispatch<React.SetStateAction<Token | null>>
  setQAsset: React.Dispatch<React.SetStateAction<Token | null>>
  assetListLoading: boolean
}

const defaultAssetPairsByNetworkName: Record<string, TickerPair> = {
  Mainnet: {
    uAssetSymbol: 'BTC',
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
  USDCPublicKey: null,
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
  const [supportedAssets, setSupportedAssets] = useState<Token[]>([])
  const [uAsset, setUAsset] = useState<Token | null>(null)
  const [qAsset, setQAsset] = useState<Token | null>(null)
  const [assetListLoading, setAssetListLoading] = useState(true)
  const srmPublicKey = useMemo(() => {
    const srm = supportedAssets.find((asset) => asset.tokenSymbol === 'SRM')
    return srm ? new PublicKey(srm.mintAddress) : null
  }, [supportedAssets])
  const USDCPublicKey = useMemo(() => {
    const usdc = supportedAssets.find((asset) => asset.tokenSymbol === 'USDC')
    return usdc ? new PublicKey(usdc.mintAddress) : null
  }, [supportedAssets])

  useEffect(() => {
    const setDefaultAssets = (assets: Token[]) => {
      if (assets && assets.length > 1) {
        const defaultAssetPair =
          defaultAssetPairsByNetworkName[endpoint.name] || {}
        let defaultUAsset: Token | null = null
        let defaultQAsset: Token | null = null
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

    const basicAssets = getAssetsByNetwork(endpoint.name)
    setSupportedAssets(basicAssets)
    setDefaultAssets(basicAssets)
    setAssetListLoading(false)
  }, [endpoint.name])

  const value = {
    supportedAssets,
    setSupportedAssets,
    srmPublicKey,
    USDCPublicKey,
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
