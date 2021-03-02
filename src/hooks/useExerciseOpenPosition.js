import React, { useCallback } from 'react'
import { PublicKey } from '@solana/web3.js'
import { Link } from '@material-ui/core'
import { exerciseCoveredCallWithRandomOptionWriter } from '@mithraic-labs/options-js-bindings'
import useConnection from './useConnection'
import useWallet from './useWallet'
import useNotifications from './useNotifications'
import { buildSolanaExplorerUrl } from '../utils/solanaExplorer'

const useExerciseOpenPosition = (
  optionMarketKey,
  exerciserQuoteAssetKey,
  exerciserUnderlyingAssetKey,
  exerciserContractTokenKey,
) => {
  const { pushNotification } = useNotifications()
  const { connection, endpoint } = useConnection()
  const { wallet, pubKey } = useWallet()

  const exercise = useCallback(async () => {
    const {
      transaction: tx,
    } = await exerciseCoveredCallWithRandomOptionWriter(
      connection,
      { publicKey: pubKey },
      endpoint.programId,
      new PublicKey(optionMarketKey),
      new PublicKey(exerciserQuoteAssetKey),
      new PublicKey(exerciserUnderlyingAssetKey),
      { publicKey: pubKey },
      new PublicKey(exerciserContractTokenKey),
      { publicKey: pubKey },
    )

    const signed = await wallet.signTransaction(tx)
    const txid = await connection.sendRawTransaction(signed.serialize())

    // TODO add the Asset Pair to the push note
    pushNotification({
      severity: 'info',
      message: `Submitted Transaction: Exercise Option`,
      link: (
        <Link href={buildSolanaExplorerUrl(txid)} target="_new">
          View on Solana Explorer
        </Link>
      ),
    })

    await connection.confirmTransaction(txid)

    pushNotification({
      severity: 'success',
      message: `Transaction Confirmed: Exercise Option`,
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
    optionMarketKey,
    exerciserQuoteAssetKey,
    exerciserUnderlyingAssetKey,
    exerciserContractTokenKey,
    wallet,
    pushNotification,
  ])

  return {
    exercise,
  }
}

export default useExerciseOpenPosition
