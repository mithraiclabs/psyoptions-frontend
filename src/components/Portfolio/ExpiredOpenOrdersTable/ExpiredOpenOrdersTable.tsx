import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import { useConnectedWallet } from '@saberhq/use-solana';
import React from 'react';
import CSS from 'csstype';
import { TCell } from '../../Markets/styles';
import { ExpiredOpenOrdersTableHeader } from './ExpiredOpenOrdersTableHeader';
import GokiButton from '../../GokiButton';
import { useRecoilValue } from 'recoil';
import { selectOpenOrdersForExpiredOptions } from '../../../recoil';

const useStyles = makeStyles((theme) => ({
  walletButtonCell: {
    textAlign: '-webkit-center' as CSS.Property.TextAlign,
  },
}));

export const ExpiredOpenOrdersTable: React.VFC = () => {
  const classes = useStyles();
  const wallet = useConnectedWallet();
  const openOrdersForExpiredOptions = useRecoilValue(
    selectOpenOrdersForExpiredOptions,
  );

  console.log('TJ expired open orders', openOrdersForExpiredOptions);
  // TODO get the OpenOrders for expired option markets

  return (
    <Box style={{ zIndex: 1 }}>
      <TableContainer>
        <Table stickyHeader aria-label="sticky table">
          <ExpiredOpenOrdersTableHeader />
        </Table>
        <TableBody>
          {!wallet?.connected ? (
            <TableRow>
              <TCell
                align="center"
                colSpan={10}
                className={classes.walletButtonCell}
              >
                <Box p={1}>
                  <GokiButton />
                </Box>
              </TCell>
            </TableRow>
          ) : (
            openOrdersForExpiredOptions.map((openOrders) => (
              <TableRow key={openOrders.address.toString()}>
                <TCell>{openOrders.address.toString()}</TCell>
                <TCell>{openOrders.market.toString()}</TCell>
                {/* <TCell>{openOrders.market.toString()}</TCell> */}
              </TableRow>
            ))
          )}
        </TableBody>
      </TableContainer>
    </Box>
  );
};
