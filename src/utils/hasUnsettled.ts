import BN from 'bn.js';

const BN_ZERO = new BN(0);

export const hasUnsettled = (openOrders) => {
  const baseFree = openOrders?.[0]?.baseTokenFree ?? BN_ZERO;
  const quoteFree = openOrders?.[0]?.quoteTokenFree ?? BN_ZERO;

  if (baseFree.toNumber() <= 0 && quoteFree.toNumber() <= 0) {
    return false;
  }

  return true;
};
