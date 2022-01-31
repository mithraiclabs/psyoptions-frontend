import { OpenOrders } from '@project-serum/serum';
import { selector } from 'recoil';
import { openOrdersByOptionKey } from './atoms';
import {
  selectAllExpiredOptions,
  selectAllOptions,
} from '../options/selectors';
import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';

const BN_ZERO = new BN(0);

type OpenOrdersOptionTuple = [PublicKey, OpenOrders][];

export const selectOpenOrdersOptionTupleForExpiredOptions =
  selector<OpenOrdersOptionTuple>({
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
        if (emptyOpenOrders.length) {
          const optionOpenOrdersTupleArray: OpenOrdersOptionTuple =
            emptyOpenOrders.map((oo) => [option.key, oo]);
          acc = [...acc, ...optionOpenOrdersTupleArray];
        }
        return acc;
      }, [] as OpenOrdersOptionTuple);
    },
  });

export const selectUnsettledOpenOrdersOptionTupleForAllOptions =
  selector<OpenOrdersOptionTuple>({
    key: 'selectUnsettledOpenOrdersOptionTupleForAllOptions',
    get: ({ get }) => {
      const options = get(selectAllOptions);
      return options.reduce((acc, option) => {
        const optionKey = option.key.toString();
        const openOrdersForOption = get(openOrdersByOptionKey(optionKey));
        const openOrdersUnsettled = openOrdersForOption.filter(
          (openOrders) =>
            openOrders.baseTokenFree.gt(BN_ZERO) ||
            openOrders.quoteTokenFree.gt(BN_ZERO),
        );
        if (openOrdersUnsettled.length) {
          const optionOpenOrdersTupleArray: OpenOrdersOptionTuple =
            openOrdersUnsettled.map((oo) => [option.key, oo]);
          acc = [...acc, ...optionOpenOrdersTupleArray];
        }
        return acc;
      }, [] as OpenOrdersOptionTuple);
    },
  });

export const selectOpenOrdersOptionTupleForAllOptions =
  selector<OpenOrdersOptionTuple>({
    key: 'selectOpenOrdersOptionTupleForAllOptions',
    get: ({ get }) => {
      const options = get(selectAllOptions);
      return options.reduce((acc, option) => {
        const optionKey = option.key.toString();
        const openOrdersForOption = get(openOrdersByOptionKey(optionKey));
        const postedOpenOrders = openOrdersForOption.filter((openOrders) =>
          openOrders.orders.find((order) => order.toString() !== '0'),
        );
        if (postedOpenOrders.length) {
          const optionOpenOrdersTupleArray: OpenOrdersOptionTuple =
            postedOpenOrders.map((postedOpenOrder) => [
              option.key,
              postedOpenOrder,
            ]);
          acc = [...acc, ...optionOpenOrdersTupleArray];
        }
        return acc;
      }, [] as OpenOrdersOptionTuple);
    },
  });
