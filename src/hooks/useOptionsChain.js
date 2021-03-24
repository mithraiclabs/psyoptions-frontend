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
const useOptionsChain = () => {
  const { connection, dexProgramId } = useConnection()
  const { fetchMarketData } = useOptionsMarkets()
  const { uAsset, qAsset } = useAssetList()
  const {
    chain,
    setChain,
    optionsChainLoading,
    setOptionsChainLoading,
  } = useContext(OptionsChainContext)

  const fetchOptionsChain = useCallback(
    async (dateTimestamp) => {
      try {
        if (optionsChainLoading) return

        setChain([])

        if (
          !(connection instanceof Connection) ||
          !uAsset?.tokenSymbol ||
          !qAsset?.tokenSymbol ||
          !dateTimestamp
        ) {
          return
        }

        setOptionsChainLoading(true)

        const marketData = await fetchMarketData()
        if (!marketData || Object.keys(marketData).length < 1) {
          setOptionsChainLoading(false)
          setChain([])
          return
        }

        const callKeyPart = `${dateTimestamp}-${uAsset.tokenSymbol}-${qAsset.tokenSymbol}`
        const putKeyPart = `${dateTimestamp}-${qAsset.tokenSymbol}-${uAsset.tokenSymbol}`

        const callPutMap = (k) => {
          const amt = marketData[k].amountPerContract.toString()
          const qAmt = marketData[k].quoteAmountPerContract.toString()
          return {
            fraction: `${amt}/${qAmt}`,
            reciprocalFraction: `${qAmt}/${amt}`,
            ...marketData[k],
          }
        }

        const calls = Object.keys(marketData)
          .filter((k) => k.match(callKeyPart))
          .map(callPutMap)
        const puts = Object.keys(marketData)
          .filter((k) => k.match(putKeyPart))
          .map(callPutMap)

        const strikeFractions = Array.from(
          new Set([
            ...calls.map((m) => m.fraction),
            ...puts.map((m) => m.reciprocalFraction),
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
          strikeFractions.map(async (fraction) => {
            const sizes = new Set()
            const [amt, qAmt] = fraction.split('/')
            const strike = new BigNumber(qAmt).div(new BigNumber(amt))

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

                rows.push({ strike, size, call, put, key: `${size}-${strike}` })
              }),
            )
          }),
        )

        rows.sort((a, b) => a.strike.minus(b.strike).toNumber())
        setChain(rows)
        setOptionsChainLoading(false)
      } catch (err) {
        console.log(err)
        setChain([])
        setOptionsChainLoading(false)
      }
    },
    [connection, dexProgramId, uAsset, qAsset, setChain, fetchMarketData], // eslint-disable-line
  )

  return {
    chain,
    setChain,
    setOptionsChainLoading,
    fetchOptionsChain,
    optionsChainLoading,
  }
}

export default useOptionsChain
