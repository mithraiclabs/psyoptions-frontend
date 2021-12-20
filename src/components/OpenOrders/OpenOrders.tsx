import React, { useEffect } from 'react';
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableContainer,
  makeStyles,
} from '@material-ui/core';
import { useConnectedWallet } from '@saberhq/use-solana';
import GokiButton from '../GokiButton';
import OpenOrdersRow from './OpenOrdersRow';
import { TCell, THeadCell } from '../StyledComponents/Table/TableStyles';
import { SerumMarketAndProgramId } from '../../types';
import useScreenSize from '../../hooks/useScreenSize';
import CSS from 'csstype';
import { useRecoilValue } from 'recoil';
import { selectOpenOrdersOptionTupleForAllOptions } from '../../recoil';
import useSerum from '../../hooks/useSerum';
import useConnection from '../../hooks/useConnection';

const useStyles = makeStyles((theme) => ({
  headCell: {
    borderTop: 'none',
    padding: '16px 20px',
  },
  walletButtonCell: {
    textAlign: '-webkit-center' as CSS.Property.TextAlign,
  },
}));

// Render all open orders for all optionMarkets specified in props
const OpenOrders = () => {
  const classes = useStyles();
  const wallet = useConnectedWallet();
  const { dexProgramId } = useConnection();
  const { fetchMultipleSerumMarkets } = useSerum();
  const { formFactor } = useScreenSize();
  const openLimitOrders = useRecoilValue(
    selectOpenOrdersOptionTupleForAllOptions,
  );

  useEffect(() => {
    if (!dexProgramId) {
      return;
    }
    const serumKeys: SerumMarketAndProgramId[] = [];
    openLimitOrders.forEach(([optionKey, openOrders]) => {
      serumKeys.push({
        serumMarketKey: openOrders.market,
        serumProgramId: dexProgramId?.toString(),
      });
    });

    if (serumKeys.length) {
      fetchMultipleSerumMarkets(serumKeys);
    }
  }, [dexProgramId, fetchMultipleSerumMarkets, openLimitOrders]);

  return (
    <Box style={{ zIndex: 1 }}>
      <TableContainer>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <THeadCell colSpan={10} className={classes.headCell}>
                <h3 style={{ margin: 0 }}>Open Orders</h3>
              </THeadCell>
            </TableRow>
            <TableRow>
              {formFactor === 'desktop' ? (
                <>
                  <THeadCell>Side</THeadCell>
                  <THeadCell>Option Type</THeadCell>
                  <THeadCell>Asset Pair</THeadCell>
                  <THeadCell>Expiration</THeadCell>
                  <THeadCell>Strike Price</THeadCell>
                  <THeadCell>Contract Size</THeadCell>
                  <THeadCell>Order Size</THeadCell>
                  <THeadCell>Limit Price</THeadCell>
                  <THeadCell align="right">Action</THeadCell>
                </>
              ) : (
                <>
                  <THeadCell>Asset</THeadCell>
                  <THeadCell>Expiration</THeadCell>
                  <THeadCell>Limit Price</THeadCell>
                  <THeadCell align="right">Action</THeadCell>
                </>
              )}
            </TableRow>
          </TableHead>
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
              openLimitOrders.map(([optionKey, openOrders]) => (
                <OpenOrdersRow
                  optionKey={optionKey}
                  openOrders={openOrders}
                  key={`${optionKey}-${openOrders.address}`}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default React.memo(OpenOrders);
