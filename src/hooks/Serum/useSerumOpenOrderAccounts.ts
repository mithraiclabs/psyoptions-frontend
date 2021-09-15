import { OpenOrders } from '@mithraic-labs/serum';
import { useEffect } from 'react';
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext';
import useConnection from '../useConnection';
import useSerum from '../useSerum';
import useWallet from '../useWallet';
import { hasUnsettled } from '../../utils/hasUnsettled';
/**
 * Fetch and return wallet's open orders for a given serum market
 */
export const useSerumOpenOrderAccounts = (
  serumMarketAddress: string,
  skipFetch = false,
): OpenOrders[] | undefined => {
  const { connection } = useConnection();
  const { serumMarkets } = useSerum();
  const { pubKey } = useWallet();
  const [serumOpenOrders, setSerumOpenOrders] = useSerumOpenOrders();
  const serumMarket = serumMarkets[serumMarketAddress]?.serumMarket;

  useEffect(() => {
    if (serumMarket && !skipFetch && pubKey) {
      (async () => {
        const openOrders = await serumMarket.findOpenOrdersAccountsForOwner(
          connection,
          pubKey,
        );
        const containsUnsettled = hasUnsettled(openOrders);
        setSerumOpenOrders((prevSerumOpenOrders) => ({
          ...prevSerumOpenOrders,
          [serumMarketAddress]: {
            error: null,
            loading: false,
            orders: openOrders,
            hasUnsettled: containsUnsettled,
          },
        }));
      })();
    }
  }, [
    connection,
    serumMarketAddress,
    pubKey,
    serumMarket,
    setSerumOpenOrders,
    skipFetch,
  ]);

  return serumOpenOrders[serumMarketAddress]?.orders;
};
