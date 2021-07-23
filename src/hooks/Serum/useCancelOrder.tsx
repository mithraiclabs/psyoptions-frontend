import { useCallback } from 'react'

import useSerum from '../useSerum'
import useWallet from '../useWallet'
import useConnection from '../useConnection'
import { useSettleFunds } from './useSettleFunds'
import useNotifications from '../useNotifications'
import useSendTransaction from '../useSendTransaction'

export const useCancelOrder = (serumMarketAddress: string) => {
  const { connection } = useConnection()
  const { wallet, pubKey } = useWallet()
  const { serumMarkets } = useSerum()
  const { serumMarket } = serumMarkets[serumMarketAddress] || {}
  const { makeSettleFundsTx } = useSettleFunds(serumMarketAddress)
  const { pushErrorNotification } = useNotifications()
  const { sendSignedTransaction } = useSendTransaction()

  return useCallback(
    async (order) => {
      if (serumMarket) {
        try {
          const settleTx = await makeSettleFundsTx()

          const cancelTx = await serumMarket.makeCancelOrderTransaction(
            connection,
            pubKey,
            order,
          )
          const { blockhash } = await connection.getRecentBlockhash()
          cancelTx.recentBlockhash = blockhash
          cancelTx.feePayer = pubKey
          const [signedCancelTx, signedSettleTx] =
            await wallet.signAllTransactions([cancelTx, settleTx])

          sendSignedTransaction({
            signedTransaction: signedCancelTx,
            connection,
            sendingMessage: 'Processing: Cancel Order',
            successMessage: 'Confirmed: Cancel Order',
          })

          sendSignedTransaction({
            signedTransaction: signedSettleTx,
            connection,
            sendingMessage: 'Processing: Settle Funds',
            successMessage: 'Confirmed: Settle Funds',
          })
        } catch (err) {
          pushErrorNotification(err)
        }
      }
    },
    [
      connection,
      makeSettleFundsTx,
      pubKey,
      pushErrorNotification,
      sendSignedTransaction,
      serumMarket,
      wallet,
    ],
  )
}
