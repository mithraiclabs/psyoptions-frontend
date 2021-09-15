import { Order } from '../context/SerumOrderbookContext';

/**
 * Calculate the price of a market order using the current orders on the order book
 *
 * @param size
 * @param orders
 * @returns
 */
export const calculatePriceWithSlippage = (
  size: number,
  orders: Order[],
): number => {
  let remaining = size;
  let index = 0;
  while (remaining > 0 && index < orders.length) {
    const { size: sizeAtIndex } = orders[index];
    const takeAmount = sizeAtIndex >= remaining ? remaining : sizeAtIndex;
    remaining -= takeAmount;
    index += 1;
  }
  return orders[index - 1].price;
};
