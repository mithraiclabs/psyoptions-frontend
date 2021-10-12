import React from 'react';
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
import OpenOrdersRow from './OpenOrdersRow';
import { TCell, THeadCell } from './OpenOrderStyles';
import { OptionType } from '../../types';

// Render all open orders for all optionMarkets specified in props
const OpenOrders: React.FC<{
  formFactor: "desktop" | "tablet" | "mobile";
}> = ({ formFactor }) => {
  const { connected } = useWallet();
  const { optionMarketsForOpenOrders } = useSerumOpenOrders();

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
              { formFactor === 'desktop' ?
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
              </> : 
              <>
                <THeadCell>Asset</THeadCell>
                <THeadCell>Expiration</THeadCell>
                <THeadCell>Limit Price</THeadCell>
                <THeadCell align="right">Action</THeadCell>
              </>}
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
                optionMarket.serumMarketKey ?
                <OpenOrdersRow
                  formFactor={formFactor}
                  expiration={optionMarket.expiration}
                  contractSize={optionMarket.size}
                  // #TODO: change later, should have option type here
                  type={optionMarket.qAssetSymbol === "USDC" ? OptionType.CALL : OptionType.PUT}
                  qAssetSymbol={optionMarket.qAssetSymbol}
                  uAssetSymbol={optionMarket.uAssetSymbol}
                  serumMarketKey={optionMarket.serumMarketKey}
                  strikePrice={optionMarket.strike.toString()}
                  key={optionMarket.serumMarketKey?.toString()}
                /> : null
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default React.memo(OpenOrders);
