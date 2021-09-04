import { useContext } from 'react';
import type { PublicKey } from '@solana/web3.js';

import { TradeHistoryContext } from '../../context/TradeHistoryContext';

export const useTradeHistory = (serumMarketAddress: PublicKey) => {
  const { trades } = useContext(TradeHistoryContext);

  if (!serumMarketAddress)
    return {
      trades: [],
      buys: [],
      sells: [],
      avgBuyPrice: 0,
      avgSellPrice: 0,
      totalCost: 0,
      totalSales: 0,
    };

  const tradesForMarket = trades
    .filter(
      (trade) => trade.serumMarketAddress === serumMarketAddress.toString(),
    )
    .sort((a, b) => {
      const unixA = new Date(a.timestamp).getTime();
      const unixB = new Date(b.timestamp).getTime();
      return unixA - unixB;
    });

  const buys = tradesForMarket.filter((trade) => trade.side === 'buy');
  const sells = tradesForMarket.filter((trade) => trade.side === 'sell');

  const amountBought = buys.reduce((sum, trade) => sum + trade?.size, 0);
  const amountSold = sells.reduce((sum, trade) => sum + trade?.size, 0);

  const totalCost = buys.reduce(
    (sum, trade) => sum + trade?.price + trade?.feeCost,
    0,
  );
  const totalSales = sells.reduce(
    (sum, trade) => sum + trade?.price + trade?.feeCost,
    0,
  );

  const avgBuyPrice = totalCost / amountBought;
  const avgSellPrice = totalSales / amountSold;

  return {
    trades: tradesForMarket,
    buys,
    sells,
    amountBought,
    amountSold,
    avgBuyPrice,
    avgSellPrice,
  };
};
