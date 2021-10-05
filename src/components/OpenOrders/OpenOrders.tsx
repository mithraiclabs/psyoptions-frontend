import React, { useEffect, useState } from 'react';
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
import useOptionsMarkets from '../../hooks/useOptionsMarkets';
import { OptionMarket, OptionType, SerumMarketAndProgramId } from '../../types';
import useSerum from '../../hooks/useSerum';

export type OptionMarketWithSerumProgramId = OptionMarket & {
  serumProgramId: string;
};

// Render all open orders for all optionMarkets specified in props
const OpenOrders: React.FC = () => {
  const { connected } = useWallet();
  const { fetchMultipleSerumMarkets } = useSerum();
  const [, setOpenOrders] = useSerumOpenOrders();
  const [optionMarkets, setOptionMarkets] = useState([] as OptionMarketWithSerumProgramId[]);
  const { openOrders, loadingOpenOrders } = useOpenOrdersForOptionMarkets();
  const { marketsBySerumKey } = useOptionsMarkets();

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
    setOpenOrders(openOrders as any);

    const marketArray: OptionMarket[] = [];
    openOrders.forEach(order => {
      const market: OptionMarket = marketsBySerumKey[order.market.toString()];
      if (market) {
        marketArray.push({ ...market, serumProgramId: order.owner.toString() });
      }
    });

    setOptionMarkets(marketArray);

  }, [setOpenOrders, openOrders, marketsBySerumKey]);

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
              optionMarkets.map((optionMarket) => (
                <OpenOrdersForMarket
                  serumProgramId={optionMarket.serumProgramId}
                  expiration={optionMarket.expiration}
                  optionMarketUiKey={optionMarket.key}
                  contractSize={optionMarket.size}
                  // #TODO: change later, should have option type here
                  type={optionMarket.qAssetSymbol === "USDC" ? OptionType.CALL : OptionType.PUT}
                  qAssetSymbol={optionMarket.qAssetSymbol}
                  uAssetSymbol={optionMarket.uAssetSymbol}
                  serumMarketKey={optionMarket.serumMarketKey}
                  strikePrice={optionMarket.strike.toString()}
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
