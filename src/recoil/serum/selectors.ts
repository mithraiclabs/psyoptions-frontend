import { OpenOrders } from '@project-serum/serum';
import { selector } from 'recoil';
import { openOrdersByOptionKey } from './atoms';
import { selectAllExpiredOptions } from '../options/selectors';
import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';

const BN_ZERO = new BN(0);

export const selectOpenOrdersOptionTupleForExpiredOptions = selector<
  [PublicKey, OpenOrders][]
>({
  key: 'selectOpenOrdersForExpiredOptions',
  get: ({ get }) => {
    const expiredOptions = get(selectAllExpiredOptions);
    return expiredOptions.reduce((acc, option) => {
      const optionKey = option.key.toString();
      const openOrdersForOption = get(openOrdersByOptionKey(optionKey));
      const openOrdersWithNoTokens = openOrdersForOption.filter(
        (o) => o.baseTokenTotal.eq(BN_ZERO) && o.quoteTokenTotal.eq(BN_ZERO),
      );
      console.log(
        'TJ expired option open orders ',
        option.key.toString(),
        option.expirationUnixTimestamp.toString(),
        openOrdersWithNoTokens,
      );
      if (openOrdersWithNoTokens.length) {
        const optionOpenOrdersTupleArray: [PublicKey, OpenOrders][] =
          openOrdersWithNoTokens.map((oo) => [option.key, oo]);
        acc = [...acc, ...optionOpenOrdersTupleArray];
      }
      return acc;
    }, [] as [PublicKey, OpenOrders][]);
  },
});
