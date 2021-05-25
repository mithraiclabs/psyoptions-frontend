import { useContext, useCallback } from 'react'
import { PublicKey } from '@solana/web3.js'

import { SerumContext } from '../context/SerumContext'
import { SerumMarket } from '../utils/serum'
import useConnection from './useConnection'
import useNotifications from './useNotifications'

const useSerum = () => {
  const { pushNotification } = useNotifications()
  const { connection, dexProgramId } = useConnection()
  const { serumMarkets, setSerumMarkets } = useContext(SerumContext)

  /**
   * Loads a serum market into the serumMarkets state
   * Or returns the instance if one already exists for the given mints
   *
   * @param {string} mintA - Mint address of serum underlying asset
   * @param {string} mintB - Mint address of serum quote asset
   */
  const fetchSerumMarket = useCallback(
    async (mintA, mintB) => {
      const key = `${mintA}-${mintB}`

      // Set individual loading states for each market
      setSerumMarkets((markets) => ({
        ...markets,
        [key]: { loading: true },
      }))

      let serumMarket = {}
      let error = false
      try {
        serumMarket = await SerumMarket.findByAssets(
          connection,
          new PublicKey(mintA),
          new PublicKey(mintB),
          dexProgramId,
        )
      } catch (err) {
        console.error(err, mintA, mintB)
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
  }
}

export default useSerum
