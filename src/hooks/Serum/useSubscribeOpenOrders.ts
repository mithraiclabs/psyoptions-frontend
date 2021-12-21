import { OpenOrders } from '@mithraic-labs/serum';
import { PublicKey } from '@solana/web3.js';
import { useCallback, useEffect, useRef } from 'react';
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext';
import { useAddUniqueOpenOrdersByOptionKey } from '../../recoil';
import useConnection from '../useConnection';

/**
 * Create a subscription for an OpenOrders account that may not be in
 * application state yet. i.e. new OpenOrders account that will be created.
 */
export const useCreateAdHocOpenOrdersSubscription = (
  key: string,
): ((publicKey: PublicKey, optionKey: string) => void) => {
  const { connection, dexProgramId } = useConnection();
  const insertOpenOrdersByOptionKey = useAddUniqueOpenOrdersByOptionKey();
  const { setOpenOrdersBySerumMarket } = useSerumOpenOrders();
  const subRef = useRef<number | null>(null);

  useEffect(() => {
    const _subRef = subRef;

    return () => {
      if (_subRef.current) {
        connection.removeAccountChangeListener(_subRef.current);
      }
    };
  }, [connection, subRef]);

  return useCallback(
    (publicKey, optionKey) => {
      if (!dexProgramId) {
        return;
      }
      const sub = connection.onAccountChange(publicKey, (accountInfo) => {
        const _openOrder = OpenOrders.fromAccountInfo(
          publicKey,
          accountInfo,
          dexProgramId,
        );
        if (optionKey) {
          // @ts-expect-error diff imported types. This is fine
          insertOpenOrdersByOptionKey({ [optionKey]: _openOrder });
        }
        setOpenOrdersBySerumMarket((prevSerumOpenOrders) => {
          const orders = prevSerumOpenOrders[key] || [];
          // find the index of the OpenOrders instance that should be replaced
          let index = orders.findIndex((prevOpenOrder) =>
            prevOpenOrder.address.equals(publicKey),
          );
          // immutably replace the OpenOrders instance with the matching address
          orders.splice(index < 0 ? 0 : index, index < 0 ? 0 : 1, _openOrder);
          return {
            ...prevSerumOpenOrders,
            [key]: orders,
          };
        });
      });

      subRef.current = sub;
    },
    [
      connection,
      dexProgramId,
      insertOpenOrdersByOptionKey,
      key,
      setOpenOrdersBySerumMarket,
    ],
  );
};
