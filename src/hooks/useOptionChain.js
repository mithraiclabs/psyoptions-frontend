import { useCallback, useEffect, useState } from "react"
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js';
import { SerumMarket } from '../utils/serum'
import useConnection from './useConnection'
import useOptionsMarkets from './useOptionsMarkets'

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

  const getOptionsChain = useCallback(async (date) => {
    console.log('*** getOptionsChain',date, uAsset, qAsset, markets);
    const uaDecimals = new BN(10).pow(new BN(uAsset.decimals))
    const callKeyPart = `${date}-${uAsset.tokenSymbol}-${qAsset.tokenSymbol}`
    const putKeyPart = `${date}-${qAsset.tokenSymbol}-${uAsset.tokenSymbol}`

    const calls = Object.keys(markets)
      .filter((k) => k.match(callKeyPart))
      .map((k) => markets[k])
    const puts = Object.keys(markets)
      .filter((k) => k.match(putKeyPart))
      .map((k) => markets[k])


    const strikes = Array.from(
      new Set([
        ...calls.map((m) => m.strikePrice),
        // TODO reverse PUTs strikes back to calls...but see [comment](https://github.com/mithraiclabs/solana-options-frontend/issues/117#issuecomment-787984227)
        //  for why this is such a difficult task. 
        // ...puts.map((m) =>  oneBn.div(new BN(m.strikePrice)).toString(10)),
      ]),
    )

    console.log('*** strikes', strikes, callKeyPart, putKeyPart, calls, puts);

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
        const reciprocatedPutStrike = uaDecimals.div(new BN(strike)).toString(10)
        console.log('** reciprocatedPutStrike', reciprocatedPutStrike);
        const sizes = new Set()
  
        const matchingCalls = calls.filter((c) => {
          if (c.strikePrice === strike) {
            sizes.add(c.size)
            return true
          }
          return false
        })
  
        const matchingPuts = puts.filter((p) => {
          console.log('*** strike check', reciprocatedPutStrike, p.strikePrice);
          if ( p.strikePrice === reciprocatedPutStrike) {
            return true
          }
          return false
        })
  
        await Promise.all(
          Array.from(sizes).map(async (size) => {
            const putSize = (new BN(strike).mul(new BN(size))).toString(10)
            console.log('** putSize', putSize);
            let call = matchingCalls.find((c) => c.size === size)
            let put = matchingPuts.find((p) => {
              console.log('*** size check', putSize, p.size);
              return p.size === putSize
            })
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
  }, [connection, dexProgramId, markets, uAsset, qAsset])

  useEffect(() => {
    if (!uAsset?.tokenSymbol || !qAsset?.tokenSymbol || !expirationDate) {
      setChain([]);
      return;
    }

    getOptionsChain(expirationDate.unix());
  }, [getOptionsChain, expirationDate, uAsset, qAsset]);

  return {chain};
}

export default useOptionChain;
