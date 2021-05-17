import React, { useCallback } from 'react'
import Link from '@material-ui/core/Link'

import useSerum from '../useSerum'
import useWallet from '../useWallet'
import useConnection from '../useConnection'
import { useSettleFunds } from './useSettleFunds'
import useNotifications from '../useNotifications'

import { buildSolanaExplorerUrl } from '../../utils/solanaExplorer'

// Render all open orders for a given market as table rows
export const useCancelOrder = (serumKey: string) => {
  const { connection } = useConnection()
  const { wallet, pubKey } = useWallet()
  const { serumMarkets } = useSerum()
  const { serumMarket } = serumMarkets[serumKey] || {}
  const { makeSettleFundsTx } = useSettleFunds(serumKey)
  const { pushNotification } = useNotifications()

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
          const [
            signedCancelTx,
            signedSettleTx,
          ] = await wallet.signAllTransactions([cancelTx, settleTx])
          const cancelTxId = await connection.sendRawTransaction(
            signedCancelTx.serialize(),
          )

          pushNotification({
            severity: 'info',
            message: `Processing: Cancel Order`,
            link: (
              <Link href={buildSolanaExplorerUrl(cancelTxId)} target="_new">
                View on Solana Explorer
              </Link>
            ),
          })

          await connection.confirmTransaction(cancelTxId)

          pushNotification({
            severity: 'success',
            message: `Confirmed: Cancel Order`,
            link: (
              <Link href={buildSolanaExplorerUrl(cancelTxId)} target="_new">
                View on Solana Explorer
              </Link>
            ),
          })

          const settleTxId = await connection.sendRawTransaction(
            signedSettleTx.serialize(),
          )

          pushNotification({
            severity: 'info',
            message: `Processing: Settle Funds`,
            link: (
              <Link href={buildSolanaExplorerUrl(settleTxId)} target="_new">
                View on Solana Explorer
              </Link>
            ),
          })

          await connection.confirmTransaction(settleTxId)

          pushNotification({
            severity: 'success',
            message: `Confirmed: Settle Funds`,
            link: (
              <Link href={buildSolanaExplorerUrl(settleTxId)} target="_new">
                View on Solana Explorer
              </Link>
            ),
          })

          // We shouldn't have to update open orders state here because we will subscribe to changes
        } catch (err) {
          pushNotification({
            severity: 'error',
            message: `Transaction Failed: Cancel Order | Error: ${err}`,
          })
        }
      }
    },
    [
      connection,
      makeSettleFundsTx,
      pubKey,
      pushNotification,
      serumMarket,
      wallet,
    ],
  )
}
