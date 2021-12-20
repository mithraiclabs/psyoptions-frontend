import { OpenOrders } from '@project-serum/serum';
import { atomFamily } from 'recoil';

// OpenOrders can have multiple per Serum market
/**
 * Array of OpenOrder accounts keyed by option publickey.
 *
 * This could be optimized by storing a mapping from the
 * option to the OpenOrder so we can iterate over users OpenOrders
 * opposed to all the option.
 */
export const openOrdersByOptionKey = atomFamily<OpenOrders[], string>({
  key: 'openOrdersByOptionKey',
  default: [],
});
