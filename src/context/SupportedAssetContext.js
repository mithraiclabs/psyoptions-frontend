import React, { createContext, useEffect, useState } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import useConnection from '../hooks/useConnection'
import { networks } from './ConnectionContext'
import useNotifications from '../hooks/useNotifications'
import { getAssetsByNetwork } from '../utils/networkInfo';

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

const SupportedAssetContext = createContext([])

const SupportedAssetProvider = ({ children }) => {
  const { connection, endpoint } = useConnection()
  const [supportedAssets, setSupportedAssets] = useState([])
  const { pushNotification } = useNotifications()

  useEffect(() => {
    if (!(connection instanceof Connection)) {
      setSupportedAssets([])
      return
    }
    const basicAssets = getAssetsByNetwork(networks, endpoint.name)
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

  return (
    <SupportedAssetContext.Provider value={supportedAssets}>
      {children}
    </SupportedAssetContext.Provider>
  )
}

export { SupportedAssetContext, SupportedAssetProvider }
