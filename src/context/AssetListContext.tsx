import React, { createContext, useEffect, useMemo, useState } from 'react'
import { Account, Connection, PublicKey } from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import useConnection from '../hooks/useConnection'
import useNotifications from '../hooks/useNotifications'
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

// TODO see if we can query many accounts at once
const mergeAssetsWithChainData = async (
  connection: Connection,
  assets: Asset[],
) =>
  Promise.allSettled(
    assets.map(async (a) => {
      const asset = a
      const _payer = new Account()
      const token = new Token(
        connection,
        new PublicKey(a.mintAddress),
        TOKEN_PROGRAM_ID,
        _payer,
      )
      const mintInfo = await token.getMintInfo()
      asset.decimals = mintInfo.decimals
      return asset
    }),
  )

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
  const { connection, endpoint } = useConnection()
  const [supportedAssets, setSupportedAssets] = useState<Asset[]>([])
  const [uAsset, setUAsset] = useState<Asset | null>(null)
  const [qAsset, setQAsset] = useState<Asset | null>(null)
  const [assetListLoading, setAssetListLoading] = useState(true)
  const { pushNotification } = useNotifications()
  const srmPublicKey = useMemo(() => {
    const srm = supportedAssets.find((asset) => asset.tokenSymbol === 'SRM')
    return srm ? new PublicKey(srm.mintAddress) : null
  }, [supportedAssets])

  useEffect(() => {
    if (!(connection instanceof Connection)) {
      setSupportedAssets([])
      return
    }
    let unmounted = false

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

    const loadAssets = async (basicAssets: Asset[]) => {
      setAssetListLoading(true)
      try {
        const mergedAssets = await mergeAssetsWithChainData(
          connection,
          basicAssets,
        )
        const loadedAssets = mergedAssets
          .filter((res) => res.status === 'fulfilled')
          .map((res) => (res.status === 'fulfilled' && res.value) as Asset) // fulfilled check for TS
        if (unmounted) {
          return
        }
        setSupportedAssets(loadedAssets)
        setDefaultAssets(loadedAssets)
        setAssetListLoading(false)
      } catch (error) {
        if (unmounted) {
          return
        }
        pushNotification({
          severity: 'error',
          message: `${error}`,
        })
        console.error(error)
        setAssetListLoading(false)
        setSupportedAssets([])
      }
    }

    const basicAssets = getAssetsByNetwork(endpoint.name) as Asset[]
    loadAssets(basicAssets)

    // eslint-disable-next-line consistent-return
    return () => {
      unmounted = true
    }
  }, [connection, endpoint.name, pushNotification])

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
