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
import { selectOpenOrdersOptionTupleForExpiredOptions } from '../../../recoil';
import { useCloseOpenOrders } from '../../../hooks/Serum';
import Button from '@material-ui/core/Button';

const useStyles = makeStyles((theme) => ({
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletButtonCell: {
    textAlign: '-webkit-center' as CSS.Property.TextAlign,
  },
}));

export const ExpiredOpenOrdersTable: React.VFC = () => {
  const classes = useStyles();
  const wallet = useConnectedWallet();
  const openOrdersForExpiredOptions = useRecoilValue(
    selectOpenOrdersOptionTupleForExpiredOptions,
  );
  const closeOpenOrders = useCloseOpenOrders();

  return (
    <Box style={{ zIndex: 1 }}>
      <TableContainer>
        <Table stickyHeader aria-label="sticky table">
          <ExpiredOpenOrdersTableHeader />
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
              <>
                {openOrdersForExpiredOptions.map(([optionKey, openOrders]) => (
                  <TableRow
                    key={openOrders.address.toString()}
                    style={{ borderBottom: '1pt solid #ff000d' }}
                  >
                    <TCell colSpan={4}>
                      <Box display="flex">{openOrders.address.toString()}</Box>{' '}
                    </TCell>
                    <TCell colSpan={4}>{openOrders.market.toString()}</TCell>
                    <TCell colSpan={4}>
                      <Box>
                        <Box
                          display="flex"
                          flexDirection={['column', 'column', 'row']}
                          flexWrap="wrap"
                          alignItems="flex-start"
                          justifyContent="flex-start"
                        >
                          <Box p={1}>
                            <Button
                              color="primary"
                              variant="outlined"
                              onClick={() =>
                                closeOpenOrders(optionKey, openOrders)
                              }
                            >
                              Close OpenOrders Account
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    </TCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
