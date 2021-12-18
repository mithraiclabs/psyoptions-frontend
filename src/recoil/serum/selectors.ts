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
      const emptyOpenOrders = openOrdersForOption.filter(
        (openOrders) =>
          openOrders.baseTokenTotal.eq(BN_ZERO) &&
          openOrders.quoteTokenTotal.eq(BN_ZERO) &&
          !openOrders.orders.find((_order) => _order.toString() !== '0'),
      );
      console.log(
        'TJ expired option open orders ',
        option.key.toString(),
        option.expirationUnixTimestamp.toString(),
        emptyOpenOrders[0]?.address.toString(),
        emptyOpenOrders[0]?.market.toString(),
        emptyOpenOrders[0]?.orders.map((o) => o.toString()),
      );
      if (emptyOpenOrders.length) {
        const optionOpenOrdersTupleArray: [PublicKey, OpenOrders][] =
          emptyOpenOrders.map((oo) => [option.key, oo]);
        acc = [...acc, ...optionOpenOrdersTupleArray];
      }
      return acc;
    }, [] as [PublicKey, OpenOrders][]);
  },
});
