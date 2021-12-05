import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { selectAllOptions } from '../recoil';
import { TokenAccount } from '../types';
import useOwnedTokenAccounts from './useOwnedTokenAccounts';

/**
 * Get object of open positions keyed by the option key.
 *
 * Note that the option key will contain an array of token accounts
 */
const useOpenPositions = (): Record<string, TokenAccount[]> => {
  const options = useRecoilValue(selectAllOptions);
  const { ownedTokenAccounts } = useOwnedTokenAccounts();

  return useMemo(() => {
    const positions = options.reduce((acc, option) => {
      const accountsWithHoldings = ownedTokenAccounts[
        option.optionMint.toString()
      ]?.filter((optionTokenAcct) => optionTokenAcct.amount > 0);
      if (accountsWithHoldings?.length) {
        acc[option.key.toString()] = accountsWithHoldings;
      }
      return acc;
    }, {});
    return positions;
  }, [options, ownedTokenAccounts]);
};

export default useOpenPositions;
