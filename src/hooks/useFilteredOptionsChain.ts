import { useEffect, useState } from 'react';
import { SerumMarketAndProgramId, ChainRow } from 'src/types';
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
  const [filteredChains, setFilteredChains] = useState([] as ChainRow[]);
  const { serumMarkets, fetchMultipleSerumMarkets } = useSerum();
  const [direction, setDirection] = useState('');
  const [precision, setPrecision] = useState(2);
  const [orderbooks] = useSerumOrderbooks();
  const [lowestAskHighestBidPerStrike, setLowestAskHighestBidPerStrike] = useState({} as Record<string, BidAsk>);

  useEffect(() => {
    // depending on direction user chose, only show calls or puts accordingly
    const filtered: ChainRow[] = chains.filter(chain => {
      if (chain.call.key && direction === 'up')
        return true;
      if (chain.put.key && direction === 'down')
        return true;
      return false;
    });

    if (filtered[0]?.strike) {
      setPrecision(calculateStrikePrecision(chains[0].strike));
    }

    setFilteredChains(filtered);
  }, [chains, direction]);

  // Load serum markets when the options chain changes
  // Only if they don't already exist for the matching call/put
  useEffect(() => {
    const serumKeys: SerumMarketAndProgramId[] = [];
    filteredChains.forEach(chain => {
      if (
        chain.call.key && chain.call.serumMarketKey &&
        !serumMarkets[chain.call.serumMarketKey.toString()]
      ) {
        serumKeys.push({
          serumMarketKey: chain.call.serumMarketKey,
          serumProgramId: chain.call.serumProgramId,
        });
      }
      if (
        chain.put.key && chain.put.serumMarketKey &&
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
  }, [filteredChains, fetchMultipleSerumMarkets, serumMarkets]);

  // Map filtered chains to a Strike + Bid + Ask
  useEffect(() => {
    const askBidPerStrike = {} as Record<string, BidAsk>;

    filteredChains.forEach(chain => {
      let highestBid: number | null = null;
      let lowestAsk: number | null = null;
      let orderbook: OrderbookData | null;

      if (chain.call.key) {
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
  }, [filteredChains, orderbooks, precision]);

  return { lowestAskHighestBidPerStrike, setDirection };
};

export default useFilteredOptionsChain;