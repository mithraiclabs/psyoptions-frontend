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
  const { markets: marketData, marketsLoading } = useOptionsMarkets()
  const { uAsset, qAsset } = useAssetList()
  const {
    chain,
    setChain,
    optionsChainLoading,
    setOptionsChainLoading,
  } = useContext(OptionsChainContext)

  // Non-blocking fetch of serum data for each row
  const fetchSerumData = useCallback(
    async (row) => {
      const newRow = { ...row }
      console.log('Fetching serum data for', row)

      if (newRow.call?.optionMintAddress) {
        try {
          const serum = await SerumMarket.findByAssets(
            connection,
            new PublicKey(newRow.call.optionMintAddress),
            new PublicKey(newRow.call.qAssetMint),
            dexProgramId,
          )
          // TODO - this always returns null
          console.log('call srm', serum)
          newRow.call.serumMarket = serum
        } catch (err) {
          // TODO should we log error here or nah?
          console.log(err)
        }
        newRow.call.serumLoading = false
      }

      if (newRow.put?.optionMintAddress) {
        try {
          const serum = await SerumMarket.findByAssets(
            connection,
            new PublicKey(newRow.put.optionMintAddress),
            new PublicKey(newRow.put.uAssetMint),
            dexProgramId,
          )
          // TODO - this always returns null
          console.log('put srm', serum)
          newRow.put.serumMarket = serum
        } catch (err) {
          // TODO should we log error here or nah?
          console.log(err)
        }
        newRow.put.serumLoading = false
      }

      // Replace the row that changed
      setChain((existingChain) => {
        return existingChain.map((existingRow) => {
          return existingRow.key === newRow.key ? newRow : existingRow
        })
      })
    },
    [setChain, connection, dexProgramId],
  )

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
                const call = matchingCalls.find((c) => c.size === size)
                const put = matchingPuts.find(
                  (p) => p.quoteAmountPerContract.toString() === size,
                )

                const row = {
                  strike,
                  size,
                  call: call
                    ? {
                        ...template,
                        ...call,
                        serumLoading: true,
                        serumMarket: null,
                        initialized: true,
                      }
                    : template,
                  put: put
                    ? {
                        ...template,
                        ...put,
                        serumLoading: true,
                        serumMarket: null,
                        initialized: true,
                      }
                    : template,
                  key: `${callKeyPart}-${size}-${strike}`,
                }

                // Fetch for serum data should be non-blocking
                fetchSerumData(row)
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
    [
      connection,
      dexProgramId,
      uAsset,
      qAsset,
      setChain,
      marketData,
      marketsLoading,
    ],
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
