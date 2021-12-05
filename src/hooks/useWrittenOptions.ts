import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { selectAllOptions } from '../recoil';
import { TokenAccount } from '../types';
import useOwnedTokenAccounts from './useOwnedTokenAccounts';

/**
 * Check the owned tokens for tokens that match the writer mint
 *
 * @example // structure
 * {
 *  1617235200-SRM-USDC-10-10: [
 *    {
 *      amount: number
 *      mint: PublicKey
 *      pubKey: string
 *    }
 *  ]
 * }
 */
export const useWrittenOptions = (): Record<string, TokenAccount[]> => {
  const options = useRecoilValue(selectAllOptions);
  const { ownedTokenAccounts } = useOwnedTokenAccounts();

  return useMemo(() => {
    const positions = options.reduce((acc, option) => {
      const accountsWithHoldings = ownedTokenAccounts[
        option.writerTokenMint.toString()
      ]?.filter((writerTokenAcct) => writerTokenAcct.amount > 0);
      if (accountsWithHoldings?.length) {
        acc[option.key.toString()] = accountsWithHoldings;
      }
      return acc;
    }, {} as Record<string, TokenAccount[]>);
    return positions;
  }, [options, ownedTokenAccounts]);
};
