import React from 'react';
import Box from '@material-ui/core/Box';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableContainer from '@material-ui/core/TableContainer';
import { useConnectedWallet } from "@saberhq/use-solana";
import GokiButton from '../GokiButton';
import UnsettledBalancesRow from './UnsettledBalancesRow';
import { TCell, THeadCell } from '../StyledComponents/Table/TableStyles';
import { OptionType } from '../../types';
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext';
import useAssetList from '../../hooks/useAssetList';
import useScreenSize from '../../hooks/useScreenSize';

const UnsettledBalancesTable = () => {
  const wallet = useConnectedWallet();
  const { optionMarketsForOpenOrders } = useSerumOpenOrders();
  const { qAsset } = useAssetList();
  const { formFactor } = useScreenSize();

  return (
    <Box style={{ zIndex: 1 }}>
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
              { formFactor === 'desktop' ?
              <>
                <THeadCell>Option Type</THeadCell>
                <THeadCell>Asset Pair</THeadCell>
                <THeadCell>Expiration</THeadCell>
                <THeadCell>Strike Price</THeadCell>
                <THeadCell>Contract Size</THeadCell>
                <THeadCell>Options</THeadCell>
                <THeadCell>Assets</THeadCell>
                <THeadCell align="right">Action</THeadCell>
              </> :
              <>
                <THeadCell>Asset</THeadCell>
                <THeadCell>Expiration</THeadCell>
                <THeadCell>Funds</THeadCell>
                <THeadCell align="right">Action</THeadCell>
              </>}
            </TableRow>
          </TableHead>
          <TableBody>
            {!wallet?.connected ? (
              <TableRow>
                <TCell align="center" colSpan={10}>
                  <Box p={1}>
                    <GokiButton />
                  </Box>
                </TCell>
              </TableRow>
            ) : (
              optionMarketsForOpenOrders.map((optionMarket) => (
                (optionMarket.serumMarketKey && qAsset) ?
                <UnsettledBalancesRow
                  expiration={optionMarket.expiration}
                  contractSize={optionMarket.size}
                  // #TODO: change later, should have option type here
                  type={optionMarket.qAssetSymbol === "USDC" ? OptionType.CALL : OptionType.PUT}
                  qAssetSymbol={optionMarket.qAssetSymbol}
                  uAssetSymbol={optionMarket.uAssetSymbol}
                  serumMarketKey={optionMarket.serumMarketKey}
                  strikePrice={optionMarket.strikePrice ?? ''}
                  qAssetDecimals={qAsset.decimals}
                  key={`${optionMarket.serumMarketKey.toString()}-unsettled`}
                /> : null
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default React.memo(UnsettledBalancesTable);
