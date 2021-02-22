import { PublicKey } from '@solana/web3.js'
import { useState, useEffect } from 'react'
import { SerumMarket } from '../utils/serum'
import useConnection from './useConnection'

const useSerumMarketInfo = ({ uAssetMint, qAssetMint }) => {
  const [currentPairPrice, setCurrentPairPrice] = useState(0)
  const { connection } = useConnection();

  const getPairPrices = async ({ uAssetMint, qAssetMint }) => {
    const serumMarketAddress = await SerumMarket.getMarketByAssetKeys(connection, new PublicKey(uAssetMint), new PublicKey(qAssetMint));
    const serumMarket = new SerumMarket(connection, serumMarketAddress[0].publicKey);

    return serumMarket.getBidAskSpread();
  }

  useEffect(() => {
    const getPrice = async (uAssetMint, qAssetMint) => {
      const { bid } = await getPairPrices({
        uAssetMint,
        qAssetMint,
      })

      setCurrentPairPrice(bid)
    }

    if (uAssetMint && qAssetMint) {
      getPrice(uAssetMint, qAssetMint)
    }
  }, [uAssetMint, qAssetMint])

  return {
    currentPairPrice,
  }
}

export default useSerumMarketInfo
