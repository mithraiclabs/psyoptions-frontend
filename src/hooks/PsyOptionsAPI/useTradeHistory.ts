import { useContext } from 'react';
import type { PublicKey } from '@solana/web3.js';

import { TradeHistoryContext } from '../../context/TradeHistoryContext';

export const useTradeHistory = (serumMarketAddress: PublicKey) => {
  const { trades } = useContext(TradeHistoryContext);

  if (!serumMarketAddress) return [];

  return trades.filter(
    (trade) => trade.serumMarketAddress === serumMarketAddress.toString(),
  );
};
