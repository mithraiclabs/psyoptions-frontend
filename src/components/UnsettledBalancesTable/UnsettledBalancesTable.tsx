import React, { useState, useEffect } from 'react';
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
import useOptionsMarkets from '../../hooks/useOptionsMarkets';
import { OptionMarket, OptionType, SerumMarketAndProgramId } from '../../types';
import { useOpenOrdersForOptionMarkets } from '../../hooks/useOpenOrdersForOptionMarkets';
import Loading from '../Loading';
import useSerum from '../../hooks/useSerum';
import { SerumOpenOrders, useSerumOpenOrders } from '../../context/SerumOpenOrdersContext';
import { OpenOrders as Orders } from '@mithraic-labs/serum';

const UnsettledBalancesTable: React.FC<{
  qAssetDecimals: number;
}> = ({ qAssetDecimals }) => {
  const { connected } = useWallet();
  const { fetchMultipleSerumMarkets } = useSerum();
  const { openOrdersBySerumMarket: prevOpenOrders, setOpenOrdersBySerumMarket } = useSerumOpenOrders();
  const { marketsBySerumKey } = useOptionsMarkets();
  const [optionMarkets, setOptionMarkets] = useState([] as OptionMarket[]);
  const { openOrders, loadingOpenOrders } = useOpenOrdersForOptionMarkets();

  // fetch serum markets of the open orders
  useEffect(() => {
    const serumKeys: SerumMarketAndProgramId[] = [];
    openOrders.forEach(order => {
      serumKeys.push({
        serumMarketKey: order.market,
        serumProgramId: order.owner.toString(),
      });
    });

    if (serumKeys.length) {
      fetchMultipleSerumMarkets(serumKeys);
    }

  }, [openOrders, fetchMultipleSerumMarkets]);

  // grab option markets of the open orders
  useEffect(() => {
    const newOpenOrders: SerumOpenOrders = prevOpenOrders;
    const marketArray: OptionMarket[] = [];

    openOrders.forEach(orders => {
      const serumMarketKey = orders.market.toString();
      const market: OptionMarket = marketsBySerumKey[serumMarketKey];
      if (!newOpenOrders[serumMarketKey])
        newOpenOrders[serumMarketKey] = [] as Orders[];

      newOpenOrders[serumMarketKey].push(orders);

      if (market)
        marketArray.push({ ...market, serumProgramId: orders.owner.toString() });
    });

    setOptionMarkets(marketArray);
    setOpenOrdersBySerumMarket(newOpenOrders);

  }, [prevOpenOrders, setOpenOrdersBySerumMarket, openOrders, marketsBySerumKey]);

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
            ) : loadingOpenOrders ? (
              <TCell colSpan={9}>
                <Loading />
              </TCell>
            ) : (
              optionMarkets.map((optionMarket) => (
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
                  optionMarketUiKey={optionMarket.key}
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
