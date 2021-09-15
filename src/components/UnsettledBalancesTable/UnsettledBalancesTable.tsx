import React from 'react';
import Box from '@material-ui/core/Box';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableContainer from '@material-ui/core/TableContainer';

import useWallet from '../../hooks/useWallet';
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext';

import ConnectButton from '../ConnectButton';
import UnsettledBalancesRow from './UnsettledBalancesRow';
import { TCell, THeadCell } from './UnsettledBalancesStyles';
import { CallOrPut } from '../../types';

const UnsettledBalancesTable: React.FC<{
  optionMarkets: CallOrPut[];
  uAssetDecimals: number;
  qAssetDecimals: number;
}> = ({ optionMarkets, uAssetDecimals, qAssetDecimals }) => {
  const { connected } = useWallet();
  const [serumOpenOrders] = useSerumOpenOrders();

  const hasUnsettled = Object.values(serumOpenOrders)
    .map((serumMarketAddress) => {
      return !!serumMarketAddress?.hasUnsettled;
    })
    .includes(true);

  // Don't show if not connected or has no unsettled
  if (!connected || !hasUnsettled) {
    return null;
  }

  // filters out non-initialized serum markets
  const existingMarketsArray = optionMarkets
    .map((optionMarket) => {
      if (optionMarket?.serumMarketKey) {
        return optionMarket;
      }
      return undefined;
    })
    .filter((item) => !!item);

  return (
    <Box mt={'20px'}>
      <TableContainer>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <THeadCell
                colSpan={9}
                style={{ borderTop: 'none', padding: '16px 20px' }}
              >
                <h3 style={{ margin: 0 }}>Unsettled Balances</h3>
              </THeadCell>
            </TableRow>
            <TableRow>
              <THeadCell>Option Type</THeadCell>
              <THeadCell>Asset Pair</THeadCell>
              <THeadCell>Expiration</THeadCell>
              <THeadCell>Strike Price</THeadCell>
              <THeadCell>Contract Size</THeadCell>
              <THeadCell>Options</THeadCell>
              <THeadCell>Assets</THeadCell>
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
            ) : (
              existingMarketsArray.map((optionMarket) => (
                <UnsettledBalancesRow
                  {...optionMarket}
                  uAssetDecimals={uAssetDecimals}
                  qAssetDecimals={qAssetDecimals}
                  key={`${optionMarket.serumMarketKey.toString()}-unsettled`}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default React.memo(UnsettledBalancesTable);
