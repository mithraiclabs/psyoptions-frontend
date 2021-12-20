import React, { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useSerumOrderbooks } from '../../context/SerumOrderbookContext';
import { OpenOrders } from '@project-serum/serum';
import { OrderRow } from './OrderRow';

type SerumBidOrAsk = {
  side: string;
  price: number;
  size: number;
  openOrdersAddress: PublicKey;
};
// Render all open orders for a given market as table rows
const OpenOrdersRow: React.VFC<{
  optionKey: PublicKey;
  openOrders: OpenOrders;
}> = ({ optionKey, openOrders }) => {
  const [orderbooks] = useSerumOrderbooks();
  const [actualOpenOrders, setActualOpenOrders] = useState(
    [] as SerumBidOrAsk[],
  );
  const serumMarketAddress = openOrders.market.toString();

  useEffect(() => {
    if (!orderbooks[serumMarketAddress]) {
      return setActualOpenOrders([]);
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
      if (order.openOrdersAddress.equals(openOrders.address)) {
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
      if (order.openOrdersAddress.equals(openOrders.address)) {
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
      {actualOpenOrders.map((order) => {
        return (
          <OrderRow
            openOrders={openOrders}
            optionKey={optionKey}
            order={order}
            key={JSON.stringify(order)}
          />
        );
      })}
    </>
  );
};

export default React.memo(OpenOrdersRow);
