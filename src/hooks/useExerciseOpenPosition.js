import React, { useCallback } from 'react'
import { PublicKey } from '@solana/web3.js'
import { Link } from '@material-ui/core'
import { exerciseCoveredCall } from '@mithraic-labs/psyoptions'
import useConnection from './useConnection'
import useWallet from './useWallet'
import useNotifications from './useNotifications'
import { buildSolanaExplorerUrl } from '../utils/solanaExplorer'

const useExerciseOpenPosition = (
  market,
  exerciserQuoteAssetAddress,
  exerciserUnderlyingAssetAddress,
  exerciserContractTokenAddress,
) => {
  const { pushNotification } = useNotifications()
  const { connection, endpoint } = useConnection()
  const { wallet, pubKey } = useWallet()

  const exercise = useCallback(async () => {
    const { transaction: tx } = await exerciseCoveredCall({
      connection,
      payer: { publicKey: pubKey },
      programId: endpoint.programId,
      optionMintKey: new PublicKey(market.optionMintAddress),
      optionMarketKey: new PublicKey(market.optionMarketDataAddress),
      exerciserQuoteAssetKey: new PublicKey(exerciserQuoteAssetAddress),
      exerciserUnderlyingAssetKey: new PublicKey(
        exerciserUnderlyingAssetAddress,
      ),
      exerciserQuoteAssetAuthorityAccount: { publicKey: pubKey },
      underlyingAssetPoolKey: market.underlyingAssetPoolKey,
      quoteAssetPoolKey: market.quoteAssetPoolKey,
      optionTokenKey: new PublicKey(exerciserContractTokenAddress),
      optionTokenAuthorityAccount: { publicKey: pubKey },
    })

    const signed = await wallet.signTransaction(tx)
    const txid = await connection.sendRawTransaction(signed.serialize())

    // TODO add the Asset Pair to the push note
    pushNotification({
      severity: 'info',
      message: `Processing: Exercise Option`,
      link: (
        <Link href={buildSolanaExplorerUrl(txid)} target="_new">
          View on Solana Explorer
        </Link>
      ),
    })

    await connection.confirmTransaction(txid)

    pushNotification({
      severity: 'success',
      message: `Confirmed: Exercise Option`,
      link: (
        <Link href={buildSolanaExplorerUrl(txid)} target="_new">
          View on Solana Explorer
        </Link>
      ),
    })

    return txid
  }, [
    connection,
    pubKey,
    endpoint.programId,
    market,
    exerciserQuoteAssetAddress,
    exerciserUnderlyingAssetAddress,
    exerciserContractTokenAddress,
    wallet,
    pushNotification,
  ])

  return {
    exercise,
  }
}

export default useExerciseOpenPosition
