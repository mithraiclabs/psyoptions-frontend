import { PublicKey } from '@solana/web3.js'
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
      const serumMarkets = await SerumMarket.getMarketByAssetKeys(
        connection,
        new PublicKey(_uAssetMint),
        new PublicKey(_qAssetMint),
      )
      const serumMarketAddress = serumMarkets[0].publicKey
      const serumMarket = new SerumMarket(connection, serumMarketAddress)
      await serumMarket.initMarket()

      const prices = await serumMarket.getBidAskSpread()
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
