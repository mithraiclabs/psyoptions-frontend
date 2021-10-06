import { OpenOrders } from '@mithraic-labs/serum';
import { PublicKey } from '@solana/web3.js';
import { useCallback, useEffect, useRef } from 'react';
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext';
import useConnection from '../useConnection';

/**
 * Handle subscriptions to given serum OpenOrders
 */
export const useSubscribeOpenOrders = (): void => {
  const { connection, dexProgramId } = useConnection();
  const { openOrdersBySerumMarket, setOpenOrdersBySerumMarket } = useSerumOpenOrders();

  useEffect(() => {
    let subscriptions: number[];
    Object.keys(openOrdersBySerumMarket).map((serumMarketKey) => {
      const openOrder = openOrdersBySerumMarket[serumMarketKey];
      if (openOrder) {
        openOrder.forEach(order => {
          const subscription = connection.onAccountChange(order.address, (accountInfo) => {
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
              const updatedOpenOrders = Object.assign([], orders, {
                [index]: _openOrder,
              });
    
              return {
                ...prevSerumOpenOrders,
                [serumMarketKey]: updatedOpenOrders
              };
            });
          });
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
  }, [
    connection,
    dexProgramId,
    openOrdersBySerumMarket,
    setOpenOrdersBySerumMarket,
  ]);
};

/**
 * Create a subscription for an OpenOrders account that may not be in
 * application state yet. i.e. new OpenOrders account that will be created.
 */
export const useCreateAdHocOpenOrdersSubscription = (
  key: string,
): ((publicKey: PublicKey) => void) => {
  const { connection, dexProgramId } = useConnection();
  const { setOpenOrdersBySerumMarket } = useSerumOpenOrders();
  const subRef = useRef<number | null>(null);

  useEffect(() => {
    const _subRef = subRef;

    return () => {
      if (_subRef.current) {
        connection.removeAccountChangeListener(_subRef.current);
      }
    };
  }, [connection]);

  return useCallback(
    (publicKey: PublicKey) => {
      const sub = connection.onAccountChange(publicKey, (accountInfo) => {
        const _openOrder = OpenOrders.fromAccountInfo(
          publicKey,
          accountInfo,
          dexProgramId,
        );
        setOpenOrdersBySerumMarket((prevSerumOpenOrders) => {
          const orders = prevSerumOpenOrders[key] || [];
          // find the index of the OpenOrders instance that should be replaced
          let index = orders.findIndex((prevOpenOrder) =>
            prevOpenOrder.address.equals(publicKey),
          );
          // if used to listen to an account before it's initialized,
          // then we must set the index to 0
          if (index < 0) {
            index = 0;
          }
          // immutably replace the OpenOrders instance with the matching address
          const updatedOpenOrders = Object.assign([], orders, {
            [index]: _openOrder,
          });

          return {
            ...prevSerumOpenOrders,
            [key]: updatedOpenOrders
          };
        });
      });

      subRef.current = sub;
    },
    [connection, dexProgramId, key, setOpenOrdersBySerumMarket],
  );
};
