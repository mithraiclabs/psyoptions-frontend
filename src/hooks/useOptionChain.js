import { useCallback, useEffect, useState } from "react"
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js';
import { SerumMarket } from '../utils/serum'
import useConnection from './useConnection'
import useOptionsMarkets from './useOptionsMarkets'

const oneBn = new BN('1');

/**
 * 
 * @param {moment} expirationDate 
 * @param {*} uAsset 
 * @param {*} qAsset 
 */
const useOptionChain = (expirationDate, uAsset, qAsset) => {
  const { connection, dexProgramId } = useConnection();
  const { markets } = useOptionsMarkets()
  const [chain, setChain] = useState([]);

  const getOptionsChain = useCallback(async (uAssetSymbol, qAssetSymbol, date) => {
    const callKeyPart = `${date}-${uAssetSymbol}-${qAssetSymbol}`
    const putKeyPart = `${date}-${qAssetSymbol}-${uAssetSymbol}`

    const calls = Object.keys(markets)
      .filter((k) => k.match(callKeyPart))
      .map((k) => markets[k])
    const puts = Object.keys(markets)
      .filter((k) => k.match(putKeyPart))
      .map((k) => markets[k])


    const strikes = Array.from(
      new Set([
        ...calls.map((m) => m.strikePrice),
        ...puts.map((m) =>  oneBn.div(new BN(m.strikePrice)).toString(10)),
      ]),
    )

    console.log('*** strikes', strikes);

    const template = {
      key: '',
      bid: '--',
      ask: '--',
      change: '--',
      volume: '--',
      openInterest: '--',
      serumMarket: null,
    }

    const rows = []

    await Promise.all(
      strikes.map(async (strike) => {
        const sizes = new Set()
  
        const matchingCalls = calls.filter((c) => {
          if (c.strikePrice === strike) {
            sizes.add(c.size)
            return true
          }
          return false
        })
  
        const matchingPuts = puts.filter((p) => {
          const reciprocatedPutStrike = oneBn.div(new BN(p.strikePrice)).toString(10)
          if ( reciprocatedPutStrike === strike) {
            sizes.add(p.size)
            return true
          }
          return false
        })
  
        await Promise.all(
          Array.from(sizes).map(async (size) => {
            let call = matchingCalls.find((c) => c.size === size)
            let put = matchingPuts.find((p) => p.size === new BN(strike).mul(new BN(size)))
            // TODO if Serum market exists, load the current Bid / Ask information for the premiums
  
            if (call) {
              // check if there is a serum market
              const serumMarket = await SerumMarket.findByAssets(
                connection, 
                new PublicKey(call.optionMintAddress), 
                new PublicKey(call.qAssetMint), 
                dexProgramId,
              )
              call = {
                ...template,
                ...call,
                serumMarket,
                initialized: true,
              }
            } else {
              call = template
            }
  
            if (put) {
              // check if there is a serum market
              const serumMarket = await SerumMarket.findByAssets(
                connection, 
                new PublicKey(put.optionMintAddress), 
                // NOTE the PUTs underlying asset is the quote asset for the serum market 
                // because the strike prices are all denoted in it.
                new PublicKey(put.uAssetMint), 
                dexProgramId,
              )
              put = {
                ...template,
                ...put,
                serumMarket,
                initialized: true,
              }
            } else {
              put = template
            }
  
            rows.push({ strike, size, call, put })
          })
        )
      })
    )

    rows.sort((a, b) => a.strike - b.strike)
    setChain(rows);
  }, [connection, dexProgramId, markets, setChain])

  useEffect(() => {
    if (!uAsset?.tokenSymbol || !qAsset?.tokenSymbol || !expirationDate) {
      setChain([]);
      return;
    }

    getOptionsChain(uAsset.tokenSymbol, qAsset.tokenSymbol, expirationDate.unix());
  }, [getOptionsChain, expirationDate, uAsset, qAsset]);

  return {chain};
}

export default useOptionChain;
