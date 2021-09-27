import { useEffect, useState } from 'react';
import { SerumMarketAndProgramId } from 'src/types';
import useSerum from './useSerum';
import { OrderbookData, useSerumOrderbooks } from '../context/SerumOrderbookContext';
import { calculateStrikePrecision } from '../utils/getStrikePrices';
import useOptionsChain from './useOptionsChain';

type BidAsk = {
  bid: number | null;
  ask: number | null;
};

const useFilteredOptionsChain = () => {
  const { chains } = useOptionsChain();
  const { serumMarkets, fetchMultipleSerumMarkets } = useSerum();
  const [direction, setDirection] = useState('');
  const [precision, setPrecision] = useState(2);
  const [orderbooks] = useSerumOrderbooks();
  const [lowestAskHighestBidPerStrike, setLowestAskHighestBidPerStrike] = useState({} as Record<string, BidAsk>);

  useEffect(() => {
    if (chains[0]?.strike) {
      setPrecision(calculateStrikePrecision(chains[0].strike));
    }
  }, [chains]);

  // Load serum markets when the options chain changes
  // Only if they don't already exist for the matching call/put
  useEffect(() => {
    const serumKeys: SerumMarketAndProgramId[] = [];
    chains.forEach(chain => {
      if (
        direction === 'up' && chain.call.serumMarketKey &&
        !serumMarkets[chain.call.serumMarketKey.toString()]
      ) {
        serumKeys.push({
          serumMarketKey: chain.call.serumMarketKey,
          serumProgramId: chain.call.serumProgramId,
        });
      }
      if (
        direction === 'down' && chain.put.serumMarketKey &&
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
  }, [chains, direction, fetchMultipleSerumMarkets, serumMarkets]);

  // Map filtered chains to a Strike + Bid + Ask
  useEffect(() => {
    const askBidPerStrike = {} as Record<string, BidAsk>;

    chains.forEach(chain => {
      let highestBid: number | null = null;
      let lowestAsk: number | null = null;
      let orderbook: OrderbookData | null;

      if (direction === 'up') {
        orderbook = orderbooks[chain.call.serumMarketKey?.toString()];
      } else {
        orderbook = orderbooks[chain.put.serumMarketKey?.toString()];
      }
      highestBid = orderbook?.bids[0]?.price;
      lowestAsk = orderbook?.asks[0]?.price;

      askBidPerStrike[chain.strike.toFixed(precision)] = {
        bid: highestBid,
        ask: lowestAsk,
      };
    });

    setLowestAskHighestBidPerStrike(askBidPerStrike);
  }, [chains, direction, orderbooks, precision]);

  return { lowestAskHighestBidPerStrike, setDirection };
};

export default useFilteredOptionsChain;