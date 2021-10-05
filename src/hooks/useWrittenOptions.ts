import { useMemo } from 'react';
import { TokenAccount } from '../types';
import useOptionsMarkets from './useOptionsMarkets';
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
  const { marketsByUiKey } = useOptionsMarkets();
  const { ownedTokenAccounts } = useOwnedTokenAccounts();

  return useMemo(() => {
    const positions = Object.keys(marketsByUiKey).reduce((acc, marketKey) => {
      const writerTokenMintAddress =
      marketsByUiKey[marketKey].writerTokenMintKey.toString();
      const accountsWithHoldings = ownedTokenAccounts[
        writerTokenMintAddress
      ]?.filter((writerTokenAcct) => writerTokenAcct.amount > 0);
      if (accountsWithHoldings?.length) {
        acc[marketKey] = accountsWithHoldings;
      }
      return acc;
    }, {});
    return positions;
  }, [marketsByUiKey, ownedTokenAccounts]);
};
