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
  let sum = 0;
  while (remaining > 0 && index < orders.length) {
    const { price, size: sizeAtIndex } = orders[index];
    const takeAmount = sizeAtIndex >= remaining ? remaining : sizeAtIndex;
    sum += price * takeAmount;
    remaining -= takeAmount;
    index += 1;
  }

  // handle the case where there were less orders than size taken
  const sizeTakenFromOrders = size - remaining;

  return sum / sizeTakenFromOrders;
};
