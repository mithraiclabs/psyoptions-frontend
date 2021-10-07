import React from 'react';
import Box from '@material-ui/core/Box';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableContainer from '@material-ui/core/TableContainer';
import useWallet from '../../hooks/useWallet';
import ConnectButton from '../ConnectButton';
import UnsettledBalancesRow from './UnsettledBalancesRow';
import { TCell, THeadCell } from './UnsettledBalancesStyles';
import { OptionType } from '../../types';
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext';

const UnsettledBalancesTable: React.FC<{
  qAssetDecimals: number;
}> = ({ qAssetDecimals }) => {
  const { connected } = useWallet();
  const { optionMarketsForOpenOrders } = useSerumOpenOrders();

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
              optionMarketsForOpenOrders.map((optionMarket) => (
                <UnsettledBalancesRow
                  expiration={optionMarket.expiration}
                  contractSize={optionMarket.size}
                  // #TODO: change later, should have option type here
                  type={optionMarket.qAssetSymbol === "USDC" ? OptionType.CALL : OptionType.PUT}
                  qAssetSymbol={optionMarket.qAssetSymbol}
                  uAssetSymbol={optionMarket.uAssetSymbol}
                  serumMarketKey={optionMarket.serumMarketKey}
                  strikePrice={optionMarket.strike.toString()}
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
