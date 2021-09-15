import { Order } from '../context/SerumOrderbookContext';
import { calculatePriceWithSlippage } from './calculatePriceWithSlippage';

describe('calculatePriceWithSlippage', () => {
  it('should calculate price with slippage', () => {
    expect(
      calculatePriceWithSlippage(2, [
        { price: 100, size: 1 },
        { price: 110, size: 1 },
      ]),
    ).toEqual(110);

    expect(
      calculatePriceWithSlippage(4, [
        { price: 100, size: 1 },
        { price: 110, size: 2 },
        { price: 200, size: 3 },
      ]),
    ).toEqual(200);

    expect(
      calculatePriceWithSlippage(4, [
        { price: 200, size: 3 },
        { price: 110, size: 2 },
        { price: 100, size: 1 },
      ]),
    ).toEqual(110);
  });

  it('should gracefully handle ripping through whole book', () => {
    const orders: Order[] = [
      { price: 100, size: 1 },
      { price: 110, size: 1 },
    ];

    expect(calculatePriceWithSlippage(3, orders)).toEqual(110);
  });
});
