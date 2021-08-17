import BN from 'bn.js'
import { useSerumOpenOrderAccounts } from './useSerumOpenOrderAccounts'

const BN_ZERO = new BN(0)

/**
 * Wrapping this in a hook because it might be more complex than this.
 * It's still not clear to me why a user would have many open order accounts.
 * Maybe it's just for power users
 */
export const useUnsettledFundsForMarket = (
  key: string,
): { baseFree: BN; quoteFree: BN } => {
  const openOrders = useSerumOpenOrderAccounts(key)
  const initOpenOrders = openOrders?.[0]

  return {
    baseFree: initOpenOrders?.baseTokenFree ?? BN_ZERO,
    quoteFree: initOpenOrders?.quoteTokenFree ?? BN_ZERO,
  }
}
