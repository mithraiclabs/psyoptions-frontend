import Box from '@material-ui/core/Box';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TableBody from '@material-ui/core/TableBody';

import React, { memo } from 'react';
import theme from '../utils/theme';
import { Order } from '../context/SerumOrderbookContext';

const successColor = theme.palette.success.main;
const errorColor = theme.palette.error.main;
const primaryColor = theme.palette.primary.main;
const bgLighterColor = theme.palette.background.lighter;

const BidAskCell = withStyles({
  root: {
    padding: '2px 6px',
    borderRight: `1px solid ${bgLighterColor}`,
    fontSize: '14px',
    '&:last-child': {
      borderRight: 'none',
    },
  },
})(TableCell);

const centerBorder = { borderRight: `1px solid ${primaryColor}` };
const topRowBorder = { borderTop: `1px solid ${bgLighterColor}` };

type BidOrAsk = {
  size: number;
  price: number;
};

const OrderBook: React.FC<{
  bids: BidOrAsk[];
  asks: BidOrAsk[];
  setLimitPrice: (limitPrice: string) => void;
  setOrderSize: React.Dispatch<React.SetStateAction<number>>;
}> = ({ bids = [], asks = [], setLimitPrice, setOrderSize }) => {
  // Maybe we should do this zipping of the bids/asks elsewhere
  // Doing it here for quick and dirty solution, don't over-engineer right? :)
  const rows: { ask: Order; bid: Order; key: string | number }[] = [];
  const minRows = 4;
  // We can adjust the max rows as desired later
  const maxRows = 8;
  let i = 0;
  while (
    (rows.length < maxRows && rows.length < bids.length) ||
    rows.length < asks.length ||
    rows.length < minRows
  ) {
    rows.push({ bid: bids[i] || {}, ask: asks[i] || {}, key: i });
    i += 1;
  }

  const setPriceAndSize = (bidAsk: BidOrAsk) => {
    if (bidAsk?.price) setLimitPrice(bidAsk.price.toString());
    if (bidAsk?.size) setOrderSize(bidAsk.size);
  };

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
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </>
  );
};

export default memo(OrderBook);
