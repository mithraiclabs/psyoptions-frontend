import { Order } from '../context/SerumOrderbookContext';
import { calculateBreakevenForMarketOrder } from './calculateBreakeven';

describe('calculateBreakevenForMarketOrder', () => {
  it('should return null by default', () => {
    expect(
      calculateBreakevenForMarketOrder(2000, 0.1, 0, [
        { price: 100, size: 1 },
        { price: 110, size: 1 },
      ]),
    ).toEqual(null);
  });

  it('should calculate breakeven price', () => {
    expect(
      calculateBreakevenForMarketOrder(2000, 0.1, 2, [
        { price: 100, size: 1 },
        { price: 110, size: 1 },
      ]),
    ).toEqual(3050);

    expect(
      calculateBreakevenForMarketOrder(1000, 1, 4, [
        { price: 100, size: 1 },
        { price: 110, size: 2 },
        { price: 200, size: 3 },
      ]),
    ).toEqual(1130);

    expect(
      calculateBreakevenForMarketOrder(
        3000,
        0.1,
        4,
        [
          { price: 200, size: 3 },
          { price: 110, size: 2 },
          { price: 100, size: 1 },
        ],
        true,
      ),
    ).toEqual(1225);
  });

  it('should gracefully handle ripping through whole book', () => {
    const orders: Order[] = [
      { price: 100, size: 1 },
      { price: 110, size: 1 },
    ];

    expect(calculateBreakevenForMarketOrder(1000, 0.5, 3, orders)).toEqual(1210);
  });
});
