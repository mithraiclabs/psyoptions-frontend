import makeStyles from '@material-ui/core/styles/makeStyles';
import Table from '@material-ui/core/Table';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import React, { useMemo } from 'react';
import CSS from 'csstype';
import { THeadCell } from '../StyledComponents/Table/TableStyles';
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext';
import { CloseableOpenOrderAccountRow } from './CloseableOpenOrderAccountRow';

const useStyles = makeStyles((theme) => ({
  headCell: {
    borderTop: 'none',
    padding: '16px 20px',
  },
  walletButtonCell: {
    textAlign: '-webkit-center' as CSS.Property.TextAlign,
  },
}));

export const CloseableOpenOrderAccounts: React.VFC = () => {
  const classes = useStyles();
  const { openOrders } = useSerumOpenOrders();
  const closeableOpenOrders = useMemo(
    () =>
      openOrders.filter(
        (openOrder) =>
          openOrder.baseTokenTotal.toString() === '0' &&
          openOrder.quoteTokenTotal.toString() === '0',
      ),
    [openOrders],
  );

  return (
    <TableContainer>
      <Table stickyHeader aria-label="sticky table">
        <TableHead>
          <TableRow>
            <THeadCell colSpan={10} className={classes.headCell}>
              <h3 style={{ margin: 0 }}>
                Closeable Serum "OpenOrder" accounts
              </h3>
            </THeadCell>
          </TableRow>
        </TableHead>
        {closeableOpenOrders.map((o) => (
          <CloseableOpenOrderAccountRow openOrder={o} />
        ))}
      </Table>
    </TableContainer>
  );
};
