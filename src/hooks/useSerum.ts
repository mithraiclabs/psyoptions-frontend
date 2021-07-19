import { useContext, useCallback } from 'react'
import { PublicKey } from '@solana/web3.js'

import { Market } from '@mithraic-labs/serum'
import { SerumContext } from '../context/SerumContext'
import {
  SerumMarket,
  batchSerumMarkets,
  findMarketByAssets,
} from '../utils/serum'
import useConnection from './useConnection'
import useNotifications from './useNotifications'

const useSerum = () => {
  const { pushNotification } = useNotifications()
  const { connection, dexProgramId } = useConnection()
  const { serumMarkets, setSerumMarkets } = useContext(SerumContext)

  const fetchMultipleSerumMarkets = useCallback(
    async (serumMarketKeys: PublicKey[]) => {
      try {
        const { serumMarketsInfo } = await batchSerumMarkets(
          connection,
          serumMarketKeys,
          {},
          dexProgramId,
        )
        setSerumMarkets((_markets) => {
          const newMarkets = {}
          serumMarketsInfo.forEach(({ market }) => {
            newMarkets[
              `${market.baseMintAddress.toString()}-${market.quoteMintAddress.toString()}`
            ] = {
              loading: false,
              serumMarket: market,
            }
          })
          return { ..._markets, ...newMarkets }
        })
      } catch (error) {
        console.error(error)
      }
    },
    [setSerumMarkets, connection, dexProgramId],
  )

  /**
   * Loads a serum market into the serumMarkets state
   * Or returns the instance if one already exists for the given mints
   *
   * @param serumMarketKey - Key for the Serum market
   * @param {string} mintA - Mint address of serum underlying asset
   * @param {string} mintB - Mint address of serum quote asset
   */
  const fetchSerumMarket = useCallback(
    async (
      serumMarketKey: PublicKey | undefined,
      mintA: string,
      mintB: string,
    ) => {
      const key = `${mintA}-${mintB}`

      // Set individual loading states for each market
      setSerumMarkets((markets) => ({
        ...markets,
        [key]: { loading: true },
      }))

      let serumMarket: Market
      let error
      try {
        if (serumMarketKey) {
          serumMarket = await Market.load(
            connection,
            serumMarketKey,
            {},
            dexProgramId,
          )
        } else {
          serumMarket = await findMarketByAssets(
            connection,
            new PublicKey(mintA),
            new PublicKey(mintB),
            dexProgramId,
          )
        }
      } catch (err) {
        console.error(err)
        error = err.message
        pushNotification({
          severity: 'error',
          message: `${err}`,
        })
      }

      const newMarket = {
        loading: false,
        error,
        serumMarket,
      }

      setSerumMarkets((markets) => {
        return { ...markets, [key]: newMarket }
      })

      return newMarket
    },
    [setSerumMarkets, connection, dexProgramId, pushNotification],
  )

  return {
    serumMarkets,
    setSerumMarkets,
    fetchSerumMarket,
    fetchMultipleSerumMarkets,
  }
}

export default useSerum
