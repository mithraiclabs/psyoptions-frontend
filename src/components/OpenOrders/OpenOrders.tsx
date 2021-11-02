import React from 'react';
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableContainer,
  makeStyles,
} from '@material-ui/core';
import { useConnectedWallet } from "@saberhq/use-solana";
import {
  useSerumOpenOrders,
} from '../../context/SerumOpenOrdersContext';
import GokiButton from '../GokiButton';
import OpenOrdersRow from './OpenOrdersRow';
import { TCell, THeadCell } from '../StyledComponents/Table/TableStyles';
import { OptionType } from '../../types';
import useScreenSize from '../../hooks/useScreenSize';
import CSS from 'csstype';

const useStyles = makeStyles((theme) => ({
  headCell: {
    borderTop: 'none',
    padding: '16px 20px',
  },
  walletButtonCell: {
    textAlign: "-webkit-center" as CSS.Property.TextAlign,
  }
}));

// Render all open orders for all optionMarkets specified in props
const OpenOrders = () => {
  const classes = useStyles();
  const wallet = useConnectedWallet();
  const { optionMarketsForOpenOrders } = useSerumOpenOrders();
  const { formFactor } = useScreenSize();

  return (
    <Box style={{ zIndex: 1 }}>
      <TableContainer>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <THeadCell
                colSpan={10}
                className={classes.headCell}
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
            {!wallet?.connected ? (
              <TableRow>
                <TCell align="center" colSpan={10} className={classes.walletButtonCell}>
                  <Box p={1}>
                    <GokiButton />
                  </Box>
                </TCell>
              </TableRow>
            ) : (
              optionMarketsForOpenOrders.map((optionMarket) => (
                optionMarket.serumMarketKey ?
                <OpenOrdersRow
                  expiration={optionMarket.expiration}
                  contractSize={optionMarket.qAssetSymbol === "USDC" ? optionMarket.size : optionMarket.quoteAmountPerContract.toString()}
                  // #TODO: change later, should have option type here
                  type={optionMarket.qAssetSymbol === "USDC" ? OptionType.CALL : OptionType.PUT}
                  qAssetSymbol={optionMarket.qAssetSymbol}
                  uAssetSymbol={optionMarket.uAssetSymbol}
                  serumMarketKey={optionMarket.serumMarketKey}
                  strikePrice={optionMarket.qAssetSymbol === "USDC" ? optionMarket.strike.toString() :
                    optionMarket.amountPerContract.dividedBy(optionMarket.quoteAmountPerContract).toString()}
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
