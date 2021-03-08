import { useCallback, useContext } from 'react'
import BigNumber from 'bignumber.js'
import { Connection, PublicKey } from '@solana/web3.js'
import { SerumMarket } from '../utils/serum'
import useConnection from './useConnection'
import useOptionsMarkets from './useOptionsMarkets'
import { OptionsChainContext } from '../context/OptionsChainContext'
import useAssetList from './useAssetList'

/**
 *
 */
const useOptionChain = () => {
  const { connection, dexProgramId } = useConnection()
  const { markets } = useOptionsMarkets()
  const { uAsset, qAsset } = useAssetList()
  const { chain, setChain } = useContext(OptionsChainContext)

  const fetchOptionsChain = useCallback(
    async (dateTimestamp) => {
      const numberOfMarkets = Object.keys(markets).length
      if (
        !(connection instanceof Connection) ||
        !uAsset?.tokenSymbol ||
        !qAsset?.tokenSymbol ||
        !dateTimestamp ||
        numberOfMarkets < 1
      ) {
        setChain([])
        return
      }

      const callKeyPart = `${dateTimestamp}-${uAsset.tokenSymbol}-${qAsset.tokenSymbol}`
      const putKeyPart = `${dateTimestamp}-${qAsset.tokenSymbol}-${uAsset.tokenSymbol}`

      const calls = Object.keys(markets)
        .filter((k) => k.match(callKeyPart))
        .map((k) => markets[k])
      const puts = Object.keys(markets)
        .filter((k) => k.match(putKeyPart))
        .map((k) => ({
          ...markets[k],
          reciprocalStrike: new BigNumber(1)
            .div(new BigNumber(markets[k].strikePrice))
            .toString(10),
        }))

      // TODO - we might be able to convert amountPerContract and quoteAmountPerContract to strings and use them in the set to determine which calls/puts match up, instead of the strike price which could be something like 0.6666666667 while the inverse is 1.5
      // So for example this array can be strings of '100/150' which would be the same in both cases
      const strikes = Array.from(
        new Set([
          ...calls.map((m) => m.strikePrice),
          // TODO reverse PUTs strikes back to calls...but see [comment](https://github.com/mithraiclabs/solana-options-frontend/issues/117#issuecomment-787984227)
          //  for why this is such a difficult task.
          ...puts.map((m) => m.reciprocalStrike),
        ]),
      )

      const template = {
        key: '',
        bid: '',
        ask: '',
        change: '',
        volume: '',
        openInterest: '',
        size: '',
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
            if (p.reciprocalStrike === strike) {
              sizes.add(p.size)
              return true
            }
            return false
          })

          await Promise.all(
            Array.from(sizes).map(async (size) => {
              // const putSize = (new BN(strike).mul(new BN(size))).toString(10)
              let call = matchingCalls.find((c) => c.size === size)
              let put = matchingPuts.find((p) => p.size === size)
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
            }),
          )
        }),
      )

      rows.sort((a, b) => a.strike - b.strike)
      setChain(rows)
    },
    [connection, dexProgramId, markets, uAsset, qAsset, setChain],
  )

  return { chain, fetchOptionsChain }
}

export default useOptionChain
