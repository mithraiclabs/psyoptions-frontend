import React, { useEffect, useMemo } from 'react';
import Box from '@material-ui/core/Box';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableContainer from '@material-ui/core/TableContainer';
import useWallet from '../../hooks/useWallet';
import {
  useSerumOpenOrders,
} from '../../context/SerumOpenOrdersContext';

import ConnectButton from '../ConnectButton';
import OpenOrdersForMarket from './OpenOrdersForMarket';
import { TCell, THeadCell } from './OpenOrderStyles';
import Loading from '../Loading';
import { useOpenOrdersForOptionMarkets } from '../../hooks/useOpenOrdersForOptionMarkets';
import { CallOrPut } from '../../types';

// Render all open orders for all optionMarkets specified in props
const OpenOrders: React.FC<{
  optionMarkets: CallOrPut[]
}> = ({ optionMarkets }) => {
  const { connected } = useWallet();
  const [, setOpenOrders] = useSerumOpenOrders();
  const { openOrders, loadingOpenOrders } = useOpenOrdersForOptionMarkets();

  useEffect(() => {
    setOpenOrders(openOrders as any);
  }, [setOpenOrders, openOrders]);

  const optionMarketsArray = useMemo(
    () =>
      optionMarkets.map((optionMarket) => {
        if (optionMarket?.serumMarketKey) {
          return optionMarket;
        }
        return undefined;
      }).filter((item) => !!item),
    [optionMarkets],
  );

  return (
    <Box mt={'20px'}>
      <TableContainer>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <THeadCell
                colSpan={10}
                style={{ borderTop: 'none', padding: '16px 20px' }}
              >
                <h3 style={{ margin: 0 }}>Open Orders</h3>
              </THeadCell>
            </TableRow>
            <TableRow>
              <THeadCell>Side</THeadCell>
              <THeadCell>Option Type</THeadCell>
              <THeadCell>Asset Pair</THeadCell>
              <THeadCell>Expiration</THeadCell>
              <THeadCell>Strike Price</THeadCell>
              <THeadCell>Contract Size</THeadCell>
              <THeadCell>Order Size</THeadCell>
              <THeadCell>Limit Price</THeadCell>
              {/* <THeadCell>Filled</THeadCell> */}
              <THeadCell align="right">Action</THeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!connected ? (
              <TableRow>
                <TCell align="center" colSpan={10}>
                  <Box p={1}>
                    <ConnectButton>Connect Wallet</ConnectButton>
                  </Box>
                </TCell>
              </TableRow>
            ) : loadingOpenOrders ? (
              <TCell colSpan={9}>
                <Loading />
              </TCell>
            ) : (
              optionMarketsArray.map((optionMarket) => (
                <OpenOrdersForMarket
                  {...optionMarket}
                  optionMarketUiKey={optionMarket.key}
                  key={optionMarket.serumMarketKey.toString()}
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
