import { useCallback, useContext } from 'react'
// import BigNumber from 'bignumber.js'
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

      const callPutMap = (k) => {
        const amt = markets[k].amountPerContract.toString()
        const qAmt = markets[k].quoteAmountPerContract.toString()
        return {
          fraction: `${amt}/${qAmt}`,
          reciprocalFraction: `${qAmt}/${amt}`,
          ...markets[k],
        }
      }

      const calls = Object.keys(markets)
        .filter((k) => k.match(callKeyPart))
        .map(callPutMap)
      const puts = Object.keys(markets)
        .filter((k) => k.match(putKeyPart))
        .map(callPutMap)

      const strikeFractions = Array.from(
        new Set([
          ...calls.map((m) => m.fraction),
          ...puts.map((m) => m.reciprocalFraction),
        ]),
      )

      console.log(strikeFractions)

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
        strikeFractions.map(async (fraction) => {
          const sizes = new Set()
          const [amt, qAmt] = fraction.split('/')
          const strike = parseInt(qAmt, 10) / parseInt(amt, 10)

          const matchingCalls = calls.filter((c) => {
            if (c.fraction === fraction) {
              sizes.add(c.size)
              return true
            }
            return false
          })

          const matchingPuts = puts.filter((p) => {
            if (p.reciprocalFraction === fraction) {
              sizes.add(p.quoteAmountPerContract.toString())
              return true
            }
            return false
          })

          console.log(sizes)

          await Promise.all(
            Array.from(sizes).map(async (size) => {
              // const putSize = (new BN(strike).mul(new BN(size))).toString(10)
              let call = matchingCalls.find((c) => c.size === size)
              let put = matchingPuts.find(
                (p) => p.quoteAmountPerContract.toString() === size,
              )
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
