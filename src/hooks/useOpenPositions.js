import { useMemo } from 'react'
import useOptionsMarkets from './useOptionsMarkets'
import useOwnedTokenAccounts from './useOwnedTokenAccounts'
import {
  exerciseCoveredCallWithRandomOptionWriter
} from '@mithraic-labs/options-js-bindings'
import useConnection from './useConnection'
import useWallet from './useWallet'
/**
 * Get object of open positions keyed by the market key
 *
 * Note that the market key will contain an array of token accounts
 */
const useOpenPositions = () => {
  const { connection, endpoint } = useConnection()
  const { markets } = useOptionsMarkets()
  const { wallet, pubKey } = useWallet()

  const ownedTokens = useOwnedTokenAccounts()

  const exerciseOpenPosition = async ({
    optionMarketKey,
    exerciserQuoteAssetKey,
    exerciserUnderlyingAssetKey,
    //exerciserQuoteAssetAuthorityAccount,
    exerciserContractTokenKey,
    //exerciserContractTokenAuthorityAccount,
  }) => {
    const { transaction: tx } = await exerciseCoveredCallWithRandomOptionWriter(
      connection,
      { publicKey: pubKey },
      endpoint.programId,
      optionMarketKey,
      exerciserQuoteAssetKey,
      exerciserUnderlyingAssetKey,
      { publicKey: pubKey },
      exerciserContractTokenKey,
      { publicKey: pubKey }
    )

    const signed = await wallet.signTransaction(tx)
    const txid = await connection.sendRawTransaction(signed.serialize())

    // TODO: push "toast notifications" here that tx started and set a loading state
    console.log(`Submitted transaction ${txid}`)
    await connection.confirmTransaction(txid, 1)
    // TODO: push "toast notifications" here that tx completed and set loading state to false
    console.log(`Confirmed ${txid}`)

    return txid
  }

  return useMemo(
    () => {
      console.log('markets', markets)
      console.log('ownedtokens', ownedTokens)
      const positions = Object.keys(markets).reduce((acc, marketKey) => {
        const accountsWithHoldings = ownedTokens[
          markets[marketKey].optionMintAddress
        ]?.filter((optionTokenAcct) => optionTokenAcct.amount > 0)
        if (accountsWithHoldings?.length) {
          acc[marketKey] = accountsWithHoldings
        }
        return acc
      }, {})
      console.log('positions in memo', positions)
      return ({
        positions,
        exerciseOpenPosition
      })
    },
    [markets, ownedTokens]
  )
}

export default useOpenPositions
