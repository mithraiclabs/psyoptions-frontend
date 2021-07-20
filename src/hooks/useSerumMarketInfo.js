import { PublicKey } from '@mithraic-labs/solana-web3.js'
import { useState, useEffect } from 'react'
import { SerumMarket } from '../utils/serum'
import useConnection from './useConnection'
import useNotifications from './useNotifications'

const useSerumMarketInfo = ({ uAssetMint, qAssetMint }) => {
  const { pushNotification } = useNotifications()
  const [currentPairPrice, setCurrentPairPrice] = useState(0)
  const { connection } = useConnection()

  useEffect(() => {
    // TODO fix this
    const getPairPrices = async ({ _uAssetMint, _qAssetMint }) => {
      let prices = { bid: 0, ask: 0 }
      let serumMarkets

      try {
        serumMarkets = await SerumMarket.getMarketByAssetKeys(
          connection,
          new PublicKey(_uAssetMint),
          new PublicKey(_qAssetMint),
        )
      } catch (err) {
        // If we hit this, it most likely means the serum market for the asset pair just hasn't been created yet
        console.error(err)
        return prices
      }

      const serumMarketAddress = serumMarkets[0]?.publicKey
      if (serumMarketAddress) {
        const serumMarket = new SerumMarket(connection, serumMarketAddress)
        await serumMarket.initMarket()
        prices = await serumMarket.getBidAskSpread()
      }
      return prices
    }

    const getPrice = async (_uAssetMint, _qAssetMint) => {
      try {
        const { bid } = await getPairPrices({
          _uAssetMint,
          _qAssetMint,
        })

        setCurrentPairPrice(bid)
      } catch (err) {
        console.error(err)
        pushNotification({
          severity: 'error',
          message: `${err}`,
        })
      }
    }

    if (uAssetMint && qAssetMint) {
      getPrice(uAssetMint, qAssetMint)
    }
  }, [uAssetMint, qAssetMint, connection, pushNotification])

  return {
    marketPrice: currentPairPrice,
  }
}

export default useSerumMarketInfo
