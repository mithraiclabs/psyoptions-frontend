import { OpenOrders } from '@project-serum/serum';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import useConnection from '../hooks/useConnection';
import { useOpenOrdersForOptionMarkets } from '../hooks/useOpenOrdersForOptionMarkets';
import useOptionsMarkets from '../hooks/useOptionsMarkets';
import useSerum from '../hooks/useSerum';
import { OptionMarket, SerumMarketAndProgramId } from '../types';

export type SerumOpenOrders = Record<string, OpenOrders[]>;
type SerumOpenOrdersContext = {
  openOrdersBySerumMarket: SerumOpenOrders;
  setOpenOrdersBySerumMarket: React.Dispatch<
    React.SetStateAction<SerumOpenOrders>
  >;
  optionMarketsForOpenOrders: OptionMarket[];
};

const SerumOpenOrdersContext = createContext<SerumOpenOrdersContext>({
  openOrdersBySerumMarket: {},
  setOpenOrdersBySerumMarket: () => {},
  optionMarketsForOpenOrders: [],
});

export const SerumOpenOrdersProvider: React.FC = ({ children }) => {
  const { fetchMultipleSerumMarkets } = useSerum();
  const [openOrdersBySerumMarket, setOpenOrdersBySerumMarket] =
    useState<SerumOpenOrders>({});
  const [optionMarketsForOpenOrders, setOptionMarketsForOpenOrders] = useState(
    [] as OptionMarket[],
  );
  const { openOrders } = useOpenOrdersForOptionMarkets();
  const { marketsBySerumKey } = useOptionsMarkets();
  const { connection, dexProgramId } = useConnection();

  // fetch serum markets of the open orders
  useEffect(() => {
    const serumKeys: SerumMarketAndProgramId[] = [];
    openOrders.forEach((order) => {
      serumKeys.push({
        serumMarketKey: order.market,
        serumProgramId: order.owner.toString(),
      });
    });

    if (serumKeys.length) {
      fetchMultipleSerumMarkets(serumKeys);
    }
  }, [openOrders, fetchMultipleSerumMarkets]);

  const subscribeToPreviousOpenOrders = useCallback(() => {
    // handle subscriptions to given serum OpenOrders
    if (!dexProgramId || !connection) return;

    const subscriptions: number[] = [];
    Object.keys(openOrdersBySerumMarket).map((serumMarketKey) => {
      const openOrder = openOrdersBySerumMarket[serumMarketKey];
      if (openOrder) {
        openOrder.forEach((order) => {
          const subscription = connection.onAccountChange(
            order.address,
            (accountInfo) => {
              const _openOrder = OpenOrders.fromAccountInfo(
                order.address,
                accountInfo,
                dexProgramId,
              );
              setOpenOrdersBySerumMarket((prevSerumOpenOrders) => {
                const orders = prevSerumOpenOrders[serumMarketKey] || [];

                // find the index of the OpenOrders instance that should be replaced
                const index = orders.findIndex((prevOpenOrder) =>
                  prevOpenOrder.address.equals(order.address),
                );
                // immutably replace the OpenOrders instance with the matching address
                orders.splice(
                  index < 0 ? 0 : index,
                  index < 0 ? 0 : 1,
                  _openOrder,
                );
                return {
                  ...prevSerumOpenOrders,
                  [serumMarketKey]: orders,
                };
              });
            },
          );
          subscriptions.push(subscription);
        });
      }
    });

    return () => {
      if (subscriptions) {
        subscriptions.forEach((sub) =>
          connection.removeAccountChangeListener(sub),
        );
      }
    };
  }, [connection, dexProgramId, openOrdersBySerumMarket]);

  // grab option markets of the open orders
  useEffect(() => {
    const newOpenOrders: SerumOpenOrders = openOrdersBySerumMarket;
    const marketArray: OptionMarket[] = [];

    openOrders.forEach((orders) => {
      const serumMarketKey = orders.market.toString();
      const market: OptionMarket = marketsBySerumKey[serumMarketKey];
      if (!newOpenOrders[serumMarketKey])
        newOpenOrders[serumMarketKey] = [] as OpenOrders[];

      newOpenOrders[serumMarketKey].push(orders);

      if (market)
        marketArray.push({
          ...market,
          serumProgramId: orders.owner.toString(),
        });
    });

    setOptionMarketsForOpenOrders(marketArray);
    setOpenOrdersBySerumMarket(newOpenOrders);

    subscribeToPreviousOpenOrders();
  }, [
    openOrdersBySerumMarket,
    openOrders,
    marketsBySerumKey,
    subscribeToPreviousOpenOrders,
  ]);

  return (
    <SerumOpenOrdersContext.Provider
      value={{
        openOrdersBySerumMarket,
        setOpenOrdersBySerumMarket,
        optionMarketsForOpenOrders,
      }}
    >
      {children}
    </SerumOpenOrdersContext.Provider>
  );
};

export const useSerumOpenOrders = (): SerumOpenOrdersContext =>
  useContext(SerumOpenOrdersContext);
