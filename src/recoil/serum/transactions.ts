import { useRecoilTransaction_UNSTABLE } from 'recoil';
import _uniqby from 'lodash.uniqby';
import { openOrdersByOptionKey } from './atoms';
import { OpenOrders } from '@project-serum/serum';

/**
 * Update the mapping of open orders by option keys and ensure
 * that only unique OpenOrders are added
 */
export const useAddUniqueOpenOrdersByOptionKey = () =>
  useRecoilTransaction_UNSTABLE<[Record<string, OpenOrders>]>(
    ({ set }) =>
      (openOrdersMap) => {
        Object.keys(openOrdersMap).forEach((optionKey) => {
          set(openOrdersByOptionKey(optionKey), (curVal) =>
            _uniqby([...curVal, openOrdersMap[optionKey]], (openOrder) =>
              openOrder.address.toString(),
            ),
          );
        });
      },
    [],
  );
