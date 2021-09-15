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
  const { markets } = useOptionsMarkets();
  const { ownedTokenAccounts } = useOwnedTokenAccounts();

  return useMemo(() => {
    const positions = Object.keys(markets).reduce((acc, marketKey) => {
      const accountsWithHoldings = ownedTokenAccounts[
        markets[marketKey].optionMintKey.toString()
      ]?.filter((optionTokenAcct) => optionTokenAcct.amount > 0);
      if (accountsWithHoldings?.length) {
        acc[marketKey] = accountsWithHoldings;
      }
      return acc;
    }, {});
    return positions;
  }, [markets, ownedTokenAccounts]);
};

export default useOpenPositions;
