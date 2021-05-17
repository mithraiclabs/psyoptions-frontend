import React, { useCallback } from 'react'
import TableRow from '@material-ui/core/TableRow'
import Button from '@material-ui/core/Button'
import Link from '@material-ui/core/Link'
import moment from 'moment'

import useSerum from '../../hooks/useSerum'
import useWallet from '../../hooks/useWallet'
import useConnection from '../../hooks/useConnection'
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext'
import { useSerumOrderbooks } from '../../context/SerumOrderbookContext'
import { useSubscribeOpenOrders, useSettleFunds } from '../../hooks/Serum'
import useNotifications from '../../hooks/useNotifications'

import { buildSolanaExplorerUrl } from '../../utils/solanaExplorer'

import { TCell } from './OpenOrderStyles'

// Render all open orders for a given market as table rows
const OpenOrdersForMarket: React.FC<{
  expiration: number
  size: number
  type: string
  qAssetSymbol: string
  uAssetSymbol: string
  serumKey: string
  strikePrice: string
}> = ({
  expiration,
  size: contractSize,
  type,
  qAssetSymbol,
  uAssetSymbol,
  serumKey,
  strikePrice,
}) => {
  const { connection } = useConnection()
  const { wallet, pubKey } = useWallet()
  const { serumMarkets } = useSerum()
  const [orderbooks] = useSerumOrderbooks()
  const [openOrders] = useSerumOpenOrders()
  const { serumMarket } = serumMarkets[serumKey] || {}
  const { makeSettleFundsTx } = useSettleFunds(serumKey)
  const { pushNotification } = useNotifications()

  // TODO: maybe move this handleCancelOrder function to a hook
  const handleCancelOrder = useCallback(
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

  useSubscribeOpenOrders(serumKey)

  if (
    !serumMarket?.market ||
    !openOrders[serumKey]?.orders ||
    !orderbooks[serumKey]
  ) {
    return null
  }

  const { bidOrderbook, askOrderbook } = orderbooks[serumKey]
  let actualOpenOrders

  try {
    actualOpenOrders = serumMarket.market.filterForOpenOrders(
      bidOrderbook || [],
      askOrderbook || [],
      openOrders[serumKey]?.orders || [],
    )
  } catch (err) {
    pushNotification({
      severity: 'error',
      message: `Couldn't display open orders for option market: ${uAssetSymbol}/${qAssetSymbol} ${type} @ strike ${strikePrice}`,
    })
    console.error(err)
  }

  return (
    actualOpenOrders &&
    actualOpenOrders.map((order) => {
      return (
        <TableRow key={`${JSON.stringify(order)}`}>
          <TCell>{order?.side}</TCell>
          <TCell>{type}</TCell>
          <TCell>{`${qAssetSymbol}/${uAssetSymbol}`}</TCell>
          <TCell>
            {`${moment.utc(expiration * 1000).format('LL')} 23:59:59 UTC`}
          </TCell>
          <TCell>{strikePrice}</TCell>
          <TCell>{`${contractSize} ${uAssetSymbol}`}</TCell>
          <TCell>{order?.size}</TCell>
          <TCell>{order?.price}</TCell>
          {/* <TCell>TODO</TCell> */}
          <TCell align="right">
            <Button
              variant="outlined"
              color="primary"
              onClick={() => handleCancelOrder(order)}
            >
              Cancel
            </Button>
          </TCell>
        </TableRow>
      )
    })
  )
}

export default React.memo(OpenOrdersForMarket)
