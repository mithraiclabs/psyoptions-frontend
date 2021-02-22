import { PublicKey } from '@solana/web3.js'
import { useState, useEffect } from 'react'
import { SerumMarket } from '../utils/serum'
import useConnection from './useConnection'

const useSerumMarketInfo = ({ uAssetMint, qAssetMint }) => {
  const [currentPairPrice, setCurrentPairPrice] = useState(0)
  const { connection } = useConnection();

  const getPairPrices = async ({ uAssetMint, qAssetMint }) => {
    const serumMarkets = await SerumMarket.getMarketByAssetKeys(connection, new PublicKey(uAssetMint), new PublicKey(qAssetMint));
    const serumMarketAddress = serumMarkets[0].publicKey;
    const serumMarket = new SerumMarket(connection, serumMarketAddress);
    await serumMarket.initMarket();

    const prices = await serumMarket.getBidAskSpread();
    return prices;
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
    marketPrice: currentPairPrice,
  }
}

export default useSerumMarketInfo
