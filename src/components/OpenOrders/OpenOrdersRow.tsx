import React, { useState, useEffect } from 'react';
import {
  Box,
  TableRow,
  makeStyles,
} from '@material-ui/core';
import moment from 'moment';
import clsx from 'clsx';
import { PublicKey } from '@solana/web3.js';
import { useSerumOrderbooks } from '../../context/SerumOrderbookContext';
import { useCancelOrder } from '../../hooks/Serum';
import { TCell, TMobileCell } from '../StyledComponents/Table/TableStyles';
import TxButton from '../TxButton';
import { OptionType } from '../../types';
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext';
import useOptionsMarkets from '../../hooks/useOptionsMarkets';
import useScreenSize from '../../hooks/useScreenSize';

const useStyles = makeStyles((theme) => ({
  root: {},
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  rowWrap: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    flexFlow: "wrap"
  },
  uppercase: {
    textTransform: "uppercase",
  },
  column: {
    display: "flex",
    flexDirection: "column",
  },
  successTextColor: {
    color: theme.palette.success.main,
  },
  errorTextColor: {
    color: theme.palette.error.main,
  },
  tabletFont: {
    fontSize: "14px !important",
  },
  mobileFont: {
    fontSize: "10px !important",
  },
}));

type SerumBidOrAsk = {
  side: string;
  price: number;
  size: number;
  openOrdersAddress: PublicKey;
};

const OrderRow: React.VFC<{
  order: SerumBidOrAsk;
  type: OptionType;
  expiration: number;
  uAssetSymbol: string;
  assetPair: string;
  strikePrice: string;
  contractSize: string;
  handleCancelOrder: (order: any) => Promise<void>;
}> = ({
  order,
  type,
  expiration,
  uAssetSymbol,
  assetPair,
  strikePrice,
  contractSize,
  handleCancelOrder,
}) => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const { formFactor } = useScreenSize();

  const cancelOrder = async () => {
    setLoading(true);
    await handleCancelOrder(order);
    setLoading(false);
  };

  return (
    <TableRow>
      {formFactor === 'desktop' ?
      <>
        <TCell
          className={order?.side === 'buy' ?
            classes.successTextColor :
            classes.errorTextColor}
        >
          {order?.side}
        </TCell>
        <TCell>{type}</TCell>
        <TCell>{assetPair}</TCell>
        <TCell>
          {`${moment.utc(expiration * 1000).format('LL')} 23:59:59 UTC`}
        </TCell>
        <TCell>{strikePrice}</TCell>
        <TCell>{`${contractSize} ${uAssetSymbol}`}</TCell>
        <TCell>{order?.size}</TCell>
        <TCell
          className={order?.side === 'buy' ?
            classes.successTextColor :
            classes.errorTextColor}
        >
          {order?.price}
        </TCell>
        <TCell align="right">
          <TxButton
            variant="outlined"
            color="primary"
            onClick={cancelOrder}
            loading={loading}
          >
            {loading ? 'Canceling' : 'Cancel'}
          </TxButton>
        </TCell>
      </> :
      <>
        <TMobileCell className={clsx(classes.rowWrap,
          formFactor === "tablet" && classes.tabletFont,
          formFactor === "mobile" && classes.mobileFont)}>
          <Box pl={formFactor === "mobile" ? 1 : 2} className={classes.column}>
            <Box className={clsx(classes.uppercase,
                order?.side === 'buy' ?
                classes.successTextColor :
                classes.errorTextColor)}
            >
                {`${order?.side} ${type}`}
            </Box>
            <Box>{assetPair}</Box>
          </Box>
          <Box pl={formFactor === "mobile" ? 1 : 2} className={classes.column}>
            <Box>{`Strike: ${strikePrice}`}</Box>
            <Box>{`${contractSize} ${uAssetSymbol}`}</Box>
            <Box>{`Qty: ${order?.size}`}</Box>
          </Box>
        </TMobileCell>
        <TMobileCell className={clsx(
          formFactor === "tablet" && classes.tabletFont,
          formFactor === "mobile" && classes.mobileFont)}>
          {`${moment.utc(expiration * 1000).format('LL')} 23:59:59 UTC`}
        </TMobileCell>
        <TMobileCell
          className={clsx(order?.side === 'buy' ?
            classes.successTextColor :
            classes.errorTextColor,
            formFactor === "tablet" && classes.tabletFont,
            formFactor === "mobile" && classes.mobileFont)}
        >
          {order?.price}
        </TMobileCell>
        <TMobileCell align="right" className={clsx(
          formFactor === "tablet" && classes.tabletFont,
          formFactor === "mobile" && classes.mobileFont)}>
          <TxButton
            variant="outlined"
            color="primary"
            onClick={cancelOrder}
            loading={loading}
          >
            {loading ? 'Canceling' : 'Cancel'}
          </TxButton>
        </TMobileCell>
      </>}
    </TableRow>
  );
};

// Render all open orders for a given market as table rows
const OpenOrdersRow: React.VFC<{
  expiration: number;
  contractSize: string;
  type: OptionType;
  qAssetSymbol: string;
  uAssetSymbol: string;
  serumMarketKey: PublicKey;
  strikePrice: string;
}> = ({
  expiration,
  contractSize,
  type,
  qAssetSymbol,
  uAssetSymbol,
  serumMarketKey,
  strikePrice,
}) => {
  const { marketsBySerumKey } = useOptionsMarkets();
  const [orderbooks] = useSerumOrderbooks();
  const [actualOpenOrders, setActualOpenOrders] = useState([] as SerumBidOrAsk[]);
  const serumMarketAddress = serumMarketKey.toString();
  const { openOrdersBySerumMarket } = useSerumOpenOrders();
  const openOrders = openOrdersBySerumMarket[serumMarketAddress];
  const optionMarket = marketsBySerumKey[serumMarketAddress];
  const handleCancelOrder = useCancelOrder(serumMarketAddress, optionMarket);

  useEffect(() => {
    if (!orderbooks[serumMarketAddress] || !openOrders) {
      setActualOpenOrders([]);
      return;
    }
  
    const { bidOrderbook, askOrderbook } = orderbooks[serumMarketAddress];
    const bids = [...(bidOrderbook || [])] as SerumBidOrAsk[];
    const asks = [...(askOrderbook || [])] as SerumBidOrAsk[];
    const bidPrices = {} as any;
    const askPrices = {} as any;
  
    // Some manual bugfixing:
    // If this wallet has multiple open orders of same price
    // We need to subtract the size of all orders beyond the first order from the first one
    // Seems to be a bug in the serum code that returns orderbooks
    // The first order of a given price for a wallet returns the total size the wallet has placed at that price, rather than the single order size
  
    asks.forEach((order) => {
      if (
        openOrders.some((a) => order.openOrdersAddress.equals(a.address))
      ) {
        const askPricesArr = askPrices[`${order.price}`];
        if (askPricesArr?.length > 0) {
          askPricesArr[0].size -= order.size;
          askPricesArr.push(order);
        } else {
          askPrices[`${order.price}`] = [order];
        }
      }
    });
  
    // We can modify the bid order sizes in-place if we reverse them first
    // The order with "incorrect size" will be at the end for bids, when reversed it will be at the beginning
    bids.reverse();
    bids.forEach((order) => {
      if (
        openOrders.some((a) => order.openOrdersAddress.equals(a.address))
      ) {
        const bidPricesArr = bidPrices[`${order.price}`];
        if (bidPricesArr?.length > 0) {
          bidPricesArr[0].size -= order.size;
          bidPricesArr.push(order);
        } else {
          bidPrices[`${order.price}`] = [order];
        }
      }
    });
  
    const serumBidOrAsks = [
      ...Object.values(bidPrices),
      ...Object.values(askPrices),
    ].flat() as SerumBidOrAsk[];
    setActualOpenOrders(serumBidOrAsks);
  }, [orderbooks, serumMarketAddress, openOrders]);

  return (
    <>
      {actualOpenOrders &&
        actualOpenOrders.map((order) => {
          return (
            <OrderRow
              order={order}
              type={type}
              expiration={expiration}
              uAssetSymbol={uAssetSymbol}
              assetPair={type === 'put' ? `${qAssetSymbol}/${uAssetSymbol}` : `${uAssetSymbol}/${qAssetSymbol}`}
              strikePrice={strikePrice}
              contractSize={contractSize}
              handleCancelOrder={handleCancelOrder}
              key={JSON.stringify(order)}
            />
          );
        })}
    </>
  );
};

export default React.memo(OpenOrdersRow);
