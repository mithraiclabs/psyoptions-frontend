import { OpenOrders } from '@project-serum/serum';
import { atomFamily } from 'recoil';

// OpenOrders can have multiple per Serum market
/**
 * Array of OpenOrder accounts keyed by option publickey.
 */
export const openOrdersByOptionKey = atomFamily<OpenOrders[], string>({
  key: 'openOrdersByOptionKey',
  default: [],
});

// Goal show OpenOrders for expired markets
// Goal show OpenOrders with actual orders for all markets
