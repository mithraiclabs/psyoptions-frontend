import React, { useCallback } from 'react'
import Link from '@material-ui/core/Link'

import useSerum from '../useSerum'
import useWallet from '../useWallet'
import useConnection from '../useConnection'
import { useSettleFunds } from './useSettleFunds'
import useNotifications from '../useNotifications'
import useSendTransaction from '../useSendTransaction'

import { buildSolanaExplorerUrl } from '../../utils/solanaExplorer'

export const useCancelOrder = (serumKey: string) => {
  const { connection } = useConnection()
  const { wallet, pubKey } = useWallet()
  const { serumMarkets } = useSerum()
  const { serumMarket } = serumMarkets[serumKey] || {}
  const { makeSettleFundsTx } = useSettleFunds(serumKey)
  const { pushErrorNotification } = useNotifications()
  const { sendSignedTransaction } = useSendTransaction()

  return useCallback(
    async (order) => {
      if (serumMarket?.market) {
        try {
          const settleTx = await makeSettleFundsTx()

          const cancelTx = await serumMarket.market.makeCancelOrderTransaction(
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
