import { useCallback } from 'react'
import { PublicKey } from '@solana/web3.js'
import { exerciseCoveredCallWithRandomOptionWriter } from '@mithraic-labs/options-js-bindings'
import useConnection from './useConnection'
import useWallet from './useWallet'

const useExerciseOpenPosition = (
  optionMarketKey,
  exerciserQuoteAssetKey,
  exerciserUnderlyingAssetKey,
  exerciserContractTokenKey,
) => {
  const { connection, endpoint } = useConnection()
  const { wallet, pubKey } = useWallet()

  return useCallback(async () => {
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

    // TODO: push "toast notifications" here that tx started and set a loading state
    console.log(`Submitted transaction ${txid}`)
    await connection.confirmTransaction(txid)
    // TODO: push "toast notifications" here that tx completed and set loading state to false
    console.log(`Confirmed ${txid}`)

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
  ])
}

export default useExerciseOpenPosition
