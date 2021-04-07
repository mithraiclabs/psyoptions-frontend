import { PublicKey } from '@solana/web3.js'
import { useEffect } from 'react'
import * as Sentry from '@sentry/react'
import { SerumMarket } from '../../utils/serum'
import useConnection from '../useConnection'
import { LocalSerumMarket } from '../../types'
import { useSerumContext } from '../../context/SerumContext'

/**
 * Fetch and return a serum market
 */
export const useSerumMarket = (key: string): LocalSerumMarket | undefined => {
  const { connection, dexProgramId } = useConnection()
  const { serumMarkets, setSerumMarkets } = useSerumContext()
  const serumMarket = serumMarkets[key]

  useEffect(() => {
    if (serumMarket) {
      // Short circuit since the market is already loaded into state.
      // This data should not change, so no need to refetch
      return
    }

    setSerumMarkets((markets) => ({
      ...markets,
      [key]: { loading: true },
    }))
    const mintA = key.split('-')[0]
    const mintB = key.split('-')[1]

    ;(async () => {
      try {
        const market = await SerumMarket.findByAssets(
          connection,
          new PublicKey(mintA),
          new PublicKey(mintB),
          dexProgramId,
        )
        setSerumMarkets((markets) => ({
          ...markets,
          [key]: {
            loading: false,
            serumMarket: market,
          },
        }))
      } catch (err) {
        setSerumMarkets((markets) => ({
          ...markets,
          [key]: {
            loading: false,
            error: err,
          },
        }))
        // eslint-disable-next-line no-console
        console.log(err)
        Sentry.captureException(err)
      }
    })()
  }, [connection, dexProgramId, key, serumMarket, setSerumMarkets])

  return serumMarket
}
