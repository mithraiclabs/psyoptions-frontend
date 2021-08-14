import { useCallback } from 'react'
import { PublicKey } from '@solana/web3.js'
import { exerciseCoveredCall } from '@mithraic-labs/psyoptions'
import useConnection from './useConnection'
import useWallet from './useWallet'
import useNotifications from './useNotifications'
import useSendTransaction from './useSendTransaction'

const useExerciseOpenPosition = (
  market,
  exerciserQuoteAssetAddress,
  exerciserUnderlyingAssetAddress,
  exerciserContractTokenAddress,
) => {
  const { pushErrorNotification } = useNotifications()
  const { connection, endpoint } = useConnection()
  const { sendTransaction } = useSendTransaction()
  const { wallet, pubKey } = useWallet()

  const exercise = useCallback(async () => {
    try {
      const { transaction: tx } = await exerciseCoveredCall({
        connection,
        payerKey: pubKey,
        programId: market.psyOptionsProgramId,
        optionMintKey: market.optionMintKey,
        optionMarketKey: market.optionMarketKey,
        exerciserQuoteAssetKey: new PublicKey(exerciserQuoteAssetAddress),
        exerciserUnderlyingAssetKey: new PublicKey(
          exerciserUnderlyingAssetAddress,
        ),
        exerciserQuoteAssetAuthorityKey: pubKey,
        underlyingAssetPoolKey: market.underlyingAssetPoolKey,
        quoteAssetPoolKey: market.quoteAssetPoolKey,
        optionTokenKey: new PublicKey(exerciserContractTokenAddress),
        optionTokenAuthorityKey: pubKey,
        quoteAssetMintKey: market.quoteAssetMintKey,
      })

      // TODO add the Asset Pair to the push note messages
      await sendTransaction({
        transaction: tx,
        wallet,
        connection,
        sendingMessage: 'Processing: Exercise Option',
        successMessage: 'Confirmed: Exercise Option',
      })
    } catch (err) {
      pushErrorNotification(err)
    }
    return null
  }, [
    connection,
    pubKey,
    market,
    exerciserQuoteAssetAddress,
    exerciserUnderlyingAssetAddress,
    exerciserContractTokenAddress,
    wallet,
    pushErrorNotification,
    sendTransaction,
  ])

  return {
    exercise,
  }
}

export default useExerciseOpenPosition
