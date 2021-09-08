import { Orderbook } from '@mithraic-labs/serum';
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
    let asksSubscription;
    let bidsSubscription;
    if (serumMarket) {
      // subscribe to bid/ask on chain updates
      bidsSubscription = connection.onAccountChange(
        serumMarket.bidsAddress,
        (bidsAccount) => {
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
        },
      );
      asksSubscription = connection.onAccountChange(
        serumMarket.asksAddress,
        (asksAccount) => {
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
        },
      );
    }

    return () => {
      if (asksSubscription) {
        connection.removeAccountChangeListener(asksSubscription);
      }
      if (bidsSubscription) {
        connection.removeAccountChangeListener(bidsSubscription);
      }
    };
  }, [connection, serumMarketAddress, serumMarket, setOrderbooks]);
};
