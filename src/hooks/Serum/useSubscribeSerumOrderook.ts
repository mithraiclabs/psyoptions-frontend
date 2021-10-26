import { Orderbook } from '@project-serum/serum';
import { useEffect } from 'react';
import {
  DEFAULT_DEPTH,
  useSerumOrderbooks,
} from '../../context/SerumOrderbookContext';
import useConnection from '../useConnection';
import useSerum from '../useSerum';

/**
 * Handle subscription to serum orderbook updates for a specific market.
 *
 * Subscribes on mount
 */
export const useSubscribeSerumOrderbook = (
  serumMarketAddress: string,
): void => {
  const { connection } = useConnection();
  const { serumMarkets } = useSerum();
  const [, setOrderbooks] = useSerumOrderbooks();
  const serumMarket = serumMarkets[serumMarketAddress]?.serumMarket;

  useEffect(() => {
    if (serumMarket) {
      // subscribe to bid/ask on chain updates
      connection.onAccountChange(serumMarket.bidsAddress, (bidsAccount) => {
        const book = Orderbook.decode(serumMarket, bidsAccount.data);
        const _bids = book
          .getL2(DEFAULT_DEPTH)
          .map(([price, size]) => ({ price, size }));
        setOrderbooks((prevOrderbooks) => ({
          ...prevOrderbooks,
          [serumMarketAddress]: {
            askOrderbook: prevOrderbooks[serumMarketAddress]?.askOrderbook,
            bidOrderbook: book,
            asks: prevOrderbooks[serumMarketAddress]?.asks ?? [],
            bids: _bids,
          },
        }));
      });
      connection.onAccountChange(serumMarket.asksAddress, (asksAccount) => {
        const book = Orderbook.decode(serumMarket, asksAccount.data);
        const _asks = book
          .getL2(DEFAULT_DEPTH)
          .map(([price, size]) => ({ price, size }));
        setOrderbooks((prevOrderbooks) => ({
          ...prevOrderbooks,
          [serumMarketAddress]: {
            askOrderbook: book,
            bidOrderbook: prevOrderbooks[serumMarketAddress]?.bidOrderbook,
            asks: _asks,
            bids: prevOrderbooks[serumMarketAddress]?.bids ?? [],
          },
        }));
      });
    }

    /**
     * #TODO: Find best way to remove subscriptions here.
     *  The problem with removing the subs with a return statement here
     *  is then when user changes option expiration, they get removed,
     *  but we still need them!
     */
  }, [connection, serumMarketAddress, serumMarket, setOrderbooks]);
};
