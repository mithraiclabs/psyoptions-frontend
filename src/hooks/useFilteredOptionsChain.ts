import { useEffect, useState } from 'react';
import { OptionRow, SerumMarketAndProgramId } from '@types';
import useSerum from './useSerum';
import { OrderbookData, useSerumOrderbooks } from '../context/SerumOrderbookContext';
import useOptionsChain from './useOptionsChain';

type BidAsk = {
  bid: number | null;
  ask: number | null;
};

const useFilteredOptionsChain = (callOrPut: 'call' | 'put') => {
  const { chains } = useOptionsChain();
  const { serumMarkets, fetchMultipleSerumMarkets } = useSerum();
  const [orderbooks] = useSerumOrderbooks();
  const [lowestAskHighestBidPerStrike, setLowestAskHighestBidPerStrike] = useState({} as Record<string, BidAsk>);
  const [optionRowForStrike, setOptionRowForStrike] = useState({} as Record<string, OptionRow>);

  // Load serum markets when the options chain changes
  // Only if they don't already exist for the matching call/put
  useEffect(() => {
    const serumKeys: SerumMarketAndProgramId[] = [];
    chains.forEach(chain => {
      if (
        callOrPut === 'call' && chain.call.serumMarketKey &&
        !serumMarkets[chain.call.serumMarketKey.toString()]
      ) {
        serumKeys.push({
          serumMarketKey: chain.call.serumMarketKey,
          serumProgramId: chain.call.serumProgramId,
        });
      }
      if (
        callOrPut === 'put' && chain.put.serumMarketKey &&
        !serumMarkets[chain.put.serumMarketKey.toString()]
      ) {
        serumKeys.push({
          serumMarketKey: chain.put.serumMarketKey,
          serumProgramId: chain.put.serumProgramId,
        });
      }
    });

    if (serumKeys.length) {
      fetchMultipleSerumMarkets(serumKeys);
    }
  }, [chains, fetchMultipleSerumMarkets, serumMarkets, callOrPut]);

  // Map filtered chains to a Strike + Bid + Ask
  useEffect(() => {
    const askBidPerStrike = {} as Record<string, BidAsk>;
    const optionForStrike = {} as Record<string, OptionRow>;

    chains.forEach(chain => {
      let highestBid: number | null = null;
      let lowestAsk: number | null = null;
      let orderbook: OrderbookData | null;
      const strike = chain.strike.toString(10);

      if (callOrPut === 'call') {
        orderbook = orderbooks[chain.call.serumMarketKey?.toString()];
        optionForStrike[strike] = chain.call;
      } else {
        orderbook = orderbooks[chain.put.serumMarketKey?.toString()];
        optionForStrike[strike] = chain.put;
      }

      highestBid = orderbook?.bids[0]?.price;
      lowestAsk = orderbook?.asks[0]?.price;

      askBidPerStrike[strike] = {
        bid: highestBid,
        ask: lowestAsk,
      };
    });

    setLowestAskHighestBidPerStrike(askBidPerStrike);
    setOptionRowForStrike(optionForStrike);
  }, [chains, orderbooks, callOrPut]);

  return { lowestAskHighestBidPerStrike, optionRowForStrike };
};

export default useFilteredOptionsChain;