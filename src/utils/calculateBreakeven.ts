import { Order } from '../context/SerumOrderbookContext';

export const calculateBreakeven = (
  strike: number,
  contractSize: number,
  size: number,
  orders: Order[],
  put?: boolean,
): number | null => {
  if (size <= 0) {
    return null;
  }
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

  const avgPrice = sum / sizeTakenFromOrders;

  if (put) {
    return strike - avgPrice / contractSize;
  }

  return strike + avgPrice / contractSize;
};
