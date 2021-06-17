import React from 'react'
import TableRow from '@material-ui/core/TableRow'
import Button from '@material-ui/core/Button'
import moment from 'moment'

import useSerum from '../../hooks/useSerum'
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext'
import { useSerumOrderbooks } from '../../context/SerumOrderbookContext'
import { useSubscribeOpenOrders, useCancelOrder } from '../../hooks/Serum'
import useNotifications from '../../hooks/useNotifications'

import theme from '../../utils/theme'

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
  const { serumMarkets } = useSerum()
  const [orderbooks] = useSerumOrderbooks()
  const [openOrders] = useSerumOpenOrders()
  const { serumMarket } = serumMarkets[serumKey] || {}
  const { pushNotification } = useNotifications()

  const handleCancelOrder = useCancelOrder(serumKey)

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
        <TableRow hover key={`${JSON.stringify(order)}`}>
          <TCell
            style={{
              color:
                order?.side === 'buy'
                  ? theme.palette.success.main
                  : theme.palette.error.main,
            }}
          >
            {order?.side}
          </TCell>
          <TCell>{type}</TCell>
          <TCell>{`${qAssetSymbol}/${uAssetSymbol}`}</TCell>
          <TCell>
            {`${moment.utc(expiration * 1000).format('LL')} 23:59:59 UTC`}
          </TCell>
          <TCell>{strikePrice}</TCell>
          <TCell>{`${contractSize} ${uAssetSymbol}`}</TCell>
          <TCell>{order?.size}</TCell>
          <TCell
            style={{
              color:
                order?.side === 'buy'
                  ? theme.palette.success.main
                  : theme.palette.error.main,
            }}
          >
            {order?.price}
          </TCell>
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
