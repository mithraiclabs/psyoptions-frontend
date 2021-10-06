import React, { useState, useEffect } from 'react';
import TableRow from '@material-ui/core/TableRow';
import moment from 'moment';
import { PublicKey } from '@solana/web3.js';
import { useSerumOrderbooks } from '../../context/SerumOrderbookContext';
import { useCancelOrder } from '../../hooks/Serum';
import theme from '../../utils/theme';
import { TCell } from './OpenOrderStyles';
import TxButton from '../TxButton';
import { useOptionMarketByKey } from '../../hooks/PsyOptionsAPI/useOptionMarketByKey';
import { OptionType } from '../../types';
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext';

type SerumBidOrAsk = {
  side: string;
  price: number;
  size: number;
  openOrdersAddress: PublicKey;
};

const OrderRow = ({
  order,
  type,
  expiration,
  uAssetSymbol,
  qAssetSymbol,
  strikePrice,
  contractSize,
  handleCancelOrder,
}) => {
  const [loading, setLoading] = useState(false);

  const cancelOrder = async () => {
    setLoading(true);
    await handleCancelOrder(order);
    setLoading(false);
  };

  return (
    <TableRow hover>
      <TCell
        style={{
          color:
            order?.side === 'buy'
              ? theme.palette.success.main
              : theme.palette.error.main,
        }}
      >
        {order?.side}
      </TCell>
      <TCell>{type}</TCell>
      <TCell>{`${qAssetSymbol}/${uAssetSymbol}`}</TCell>
      <TCell>
        {`${moment.utc(expiration * 1000).format('LL')} 23:59:59 UTC`}
      </TCell>
      <TCell>{strikePrice}</TCell>
      <TCell>{`${contractSize} ${uAssetSymbol}`}</TCell>
      <TCell>{order?.size}</TCell>
      <TCell
        style={{
          color:
            order?.side === 'buy'
              ? theme.palette.success.main
              : theme.palette.error.main,
        }}
      >
        {order?.price}
      </TCell>
      {/* <TCell>TODO</TCell> */}
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
    </TableRow>
  );
};

// Render all open orders for a given market as table rows
const OpenOrdersForMarket: React.VFC<{
  expiration: number;
  optionMarketUiKey: string;
  contractSize: string;
  type: OptionType;
  qAssetSymbol: string;
  uAssetSymbol: string;
  serumMarketKey: PublicKey;
  strikePrice: string;
}> = ({
  expiration,
  optionMarketUiKey,
  contractSize,
  type,
  qAssetSymbol,
  uAssetSymbol,
  serumMarketKey,
  strikePrice,
}) => {
  const optionMarket = useOptionMarketByKey(optionMarketUiKey);
  const [orderbooks] = useSerumOrderbooks();
  const [actualOpenOrders, setActualOpenOrders] = useState([] as SerumBidOrAsk[]);
  const serumMarketAddress = serumMarketKey.toString();
  const { openOrdersBySerumMarket } = useSerumOpenOrders();
  const openOrders = openOrdersBySerumMarket[serumMarketAddress];

  const handleCancelOrder = useCancelOrder(serumMarketAddress, optionMarket);

  useEffect(() => {
    if (!orderbooks[serumMarketAddress] || !openOrders) {
      return null;
    }
  
    const { bidOrderbook, askOrderbook } = orderbooks[serumMarketAddress];
    const bids = [...(bidOrderbook || [])] as SerumBidOrAsk[];
    const asks = [...(askOrderbook || [])] as SerumBidOrAsk[];
    const bidPrices = {};
    const askPrices = {};
  
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
              qAssetSymbol={qAssetSymbol}
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

export default React.memo(OpenOrdersForMarket);
