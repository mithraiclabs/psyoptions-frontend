import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { useCallback } from 'react'
import { createInitializeMarketTx } from '../../utils/serum'
import useConnection from '../useConnection'
import useNotifications from '../useNotifications'
import useSendTransaction from '../useSendTransaction'
import useWallet from '../useWallet'

export const useInitializeSerumMarket = (): ((options: {
  baseMintKey: PublicKey
  quoteMintKey: PublicKey
  quoteLotSize: BN
}) => Promise<[PublicKey, PublicKey] | null>) => {
  const { connection, dexProgramId } = useConnection()
  const { wallet, pubKey } = useWallet()
  const { sendSignedTransaction } = useSendTransaction()
  const { pushErrorNotification } = useNotifications()

  return useCallback(
    async ({
      baseMintKey,
      quoteMintKey,
      quoteLotSize,
    }: {
      baseMintKey: PublicKey
      quoteMintKey: PublicKey
      quoteLotSize: BN
    }) => {
      try {
        // baseLotSize should be 1 -- the options market token doesn't have decimals
        const baseLotSize = new BN('1')

        const { tx1, tx2, market } = await createInitializeMarketTx({
          connection,
          payer: pubKey,
          baseMint: baseMintKey,
          quoteMint: quoteMintKey,
          baseLotSize,
          quoteLotSize,
          dexProgramId,
        })

        const signed = await wallet.signAllTransactions([tx1, tx2])

        await sendSignedTransaction({
          signedTransaction: signed[0],
          connection,
          sendingMessage: 'Sending: Init Serum market TX 1',
          successMessage: 'Confirmed: Init Serum market TX 1',
        })

        await sendSignedTransaction({
          signedTransaction: signed[1],
          connection,
          sendingMessage: 'Sending: Init Serum market TX 2',
          successMessage: 'Confirmed: Init Serum market TX 2',
        })
        return [market.publicKey, dexProgramId]
      } catch (error) {
        pushErrorNotification(error)
      }
      return null
    },
    [
      connection,
      dexProgramId,
      pubKey,
      pushErrorNotification,
      sendSignedTransaction,
      wallet,
    ],
  )
}
