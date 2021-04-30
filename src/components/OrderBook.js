import {
  Box,
  withStyles,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@material-ui/core'
import React, { memo } from 'react'
import propTypes from 'prop-types'
import theme from '../utils/theme'

const successColor = theme.palette.success.main
const errorColor = theme.palette.error.main
const primaryColor = theme.palette.primary.main
const bgLighterColor = theme.palette.background.lighter

const BidAskCell = withStyles({
  root: {
    padding: '2px 6px',
    borderRight: `1px solid ${bgLighterColor}`,
    fontSize: '12px',
    '&:last-child': {
      borderRight: 'none',
    },
  },
})(TableCell)

const centerBorder = { borderRight: `1px solid ${primaryColor}` }
const topRowBorder = { borderTop: `1px solid ${bgLighterColor}` }

const bidOrAskType = propTypes.shape({
  size: propTypes.number,
  price: propTypes.number,
})

const orderBookPropTypes = {
  bids: propTypes.arrayOf(bidOrAskType),
  asks: propTypes.arrayOf(bidOrAskType),
  setLimitPrice: propTypes.func.isRequired,
  setOrderSize: propTypes.func.isRequired
}

const OrderBook = memo(({ bids = [[]], asks = [[]], setLimitPrice, setOrderSize }) => {
  // Maybe we should do this zipping of the bids/asks elsewhere
  // Doing it here for quick and dirty solution, don't over-engineer right? :)
  const rows = []
  const minRows = 4
  let i = 0
  while (
    rows.length < bids.length ||
    rows.length < asks.length ||
    rows.length < minRows
  ) {
    rows.push({ bid: bids[i] || {}, ask: asks[i] || {}, key: i })
    i += 1
  }

  const setPriceAndSize = bidAsk => {
    if (bidAsk?.price) setLimitPrice(bidAsk.price)
    if (bidAsk?.size) setOrderSize(bidAsk.size)
  }

  return (
    <>
      <Box pb={2}>Order Book</Box>
      <Box width="100%">
        <Table>
          <TableHead>
            <TableRow style={topRowBorder}>
              <BidAskCell
                colSpan={2}
                align="left"
                style={{ ...centerBorder, fontSize: '16px' }}
              >
                Bids
              </BidAskCell>
              <BidAskCell
                colSpan={2}
                align="right"
                style={{ fontSize: '16px' }}
              >
                Asks
              </BidAskCell>
            </TableRow>
            <TableRow>
              <BidAskCell width="25%">price</BidAskCell>
              <BidAskCell width="25%" style={{ ...centerBorder }}>
                size
              </BidAskCell>
              <BidAskCell width="25%" align="right">
                size
              </BidAskCell>
              <BidAskCell width="25%" align="right">
                price
              </BidAskCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(({ bid, ask, key }) => {
              return (
                <TableRow key={key}>
                  <BidAskCell 
                    onClick={() => setPriceAndSize(bid)}
                    width="25%"
                    style={{ color: successColor, cursor: 'pointer' }}
                  >
                    {bid?.price || '\u00A0'}
                  </BidAskCell>
                  <BidAskCell 
                    onClick={() => setPriceAndSize(bid)}
                    width="25%"
                    style={{ ...centerBorder, cursor: 'pointer' }}
                  >
                    {bid?.size || '\u00A0'}
                  </BidAskCell>
                  <BidAskCell
                    onClick={() => setPriceAndSize(ask)}
                    width="25%"
                    align="right"
                    style={{ cursor: 'pointer' }}
                  >
                    {ask?.size || '\u00A0'}
                  </BidAskCell>
                  <BidAskCell
                    width="25%"
                    align="right"
                    style={{ color: errorColor, cursor: 'pointer' }}
                    onClick={() => setPriceAndSize(ask)}
                  >
                    {ask?.price || '\u00A0'}
                  </BidAskCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Box>
    </>
  )
})

OrderBook.propTypes = orderBookPropTypes

export default OrderBook
