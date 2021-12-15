import { OpenOrders } from '@project-serum/serum';
import { selector } from 'recoil';
import { openOrdersByOptionKey } from './atoms';
import { selectAllExpiredOptions } from '../options/selectors';
import { BN } from 'bn.js';

const BN_ZERO = new BN(0);

export const selectOpenOrdersForExpiredOptions = selector<OpenOrders[]>({
  key: 'selectOpenOrdersForExpiredOptions',
  get: ({ get }) => {
    const expiredOptions = get(selectAllExpiredOptions);
    return expiredOptions.reduce((acc, option) => {
      console.log(
        'TJ expired option ',
        option.key.toString(),
        option.expirationUnixTimestamp.toString(),
      );
      const optionKey = option.key.toString();
      const openOrdersForOption = get(openOrdersByOptionKey(optionKey));
      const openOrdersWithNoTokens = openOrdersForOption.filter(
        (o) => o.baseTokenTotal.eq(BN_ZERO) && o.quoteTokenTotal.eq(BN_ZERO),
      );
      if (openOrdersWithNoTokens.length) {
        acc = [...acc, ...openOrdersWithNoTokens];
      }
      return acc;
    }, [] as OpenOrders[]);
  },
});
