import { useCallback, useContext } from 'react'
import BigNumber from 'bignumber.js'
import { Connection } from '@solana/web3.js'

import useConnection from './useConnection'
import useOptionsMarkets from './useOptionsMarkets'
import { OptionsChainContext } from '../context/OptionsChainContext'
import useAssetList from './useAssetList'

const callOrPutTemplate = {
  key: '',
  bid: '',
  ask: '',
  change: '',
  volume: '',
  openInterest: '',
  size: '',
  serumKey: '',
  initialized: false,
}

/**
 *
 */
const useOptionsChain = () => {
  const { connection } = useConnection()
  const { markets: marketData, marketsLoading } = useOptionsMarkets()
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
        if (optionsChainLoading || marketsLoading) return

        if (
          !(connection instanceof Connection) ||
          !uAsset?.tokenSymbol ||
          !qAsset?.tokenSymbol ||
          !dateTimestamp ||
          !marketData ||
          Object.keys(marketData).length < 1
        ) {
          setOptionsChainLoading(false)
          setChain([])
          return
        }

        setOptionsChainLoading(true)
        console.log('Fetching options chain')

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
                const call = matchingCalls.find((c) => c.size === size)
                const put = matchingPuts.find(
                  (p) => p.quoteAmountPerContract.toString() === size,
                )

                const row = {
                  strike,
                  size,
                  call: call
                    ? {
                        ...callOrPutTemplate,
                        ...call,
                        serumKey: `${call?.optionMintAddress}-${call?.qAssetMint}`,
                        initialized: true,
                      }
                    : callOrPutTemplate,
                  put: put
                    ? {
                        ...callOrPutTemplate,
                        ...put,
                        serumKey: `${put?.optionMintAddress}-${put?.uAssetMint}`,
                        initialized: true,
                      }
                    : callOrPutTemplate,
                  key: `${callKeyPart}-${size}-${strike}`,
                }

                rows.push(row)
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
    // eslint-disable-next-line
    [connection, uAsset, qAsset, setChain, marketData, marketsLoading],
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
