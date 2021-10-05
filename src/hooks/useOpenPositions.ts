import { useMemo } from 'react';
import { TokenAccount } from '../types';
import useOptionsMarkets from './useOptionsMarkets';
import useOwnedTokenAccounts from './useOwnedTokenAccounts';

/**
 * Get object of open positions keyed by the market key
 *
 * Note that the market key will contain an array of token accounts
 */
const useOpenPositions = (): Record<string, TokenAccount[]> => {
  const { marketsByUiKey } = useOptionsMarkets();
  const { ownedTokenAccounts } = useOwnedTokenAccounts();

  return useMemo(() => {
    const positions = Object.keys(marketsByUiKey).reduce((acc, marketKey) => {
      const accountsWithHoldings = ownedTokenAccounts[
        marketsByUiKey[marketKey].optionMintKey.toString()
      ]?.filter((optionTokenAcct) => optionTokenAcct.amount > 0);
      if (accountsWithHoldings?.length) {
        acc[marketKey] = accountsWithHoldings;
      }
      return acc;
    }, {});
    return positions;
  }, [marketsByUiKey, ownedTokenAccounts]);
};

export default useOpenPositions;
