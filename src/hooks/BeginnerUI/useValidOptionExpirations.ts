import { BN } from 'bn.js';
import { useMemo } from 'react';
import { useNonExpiredOptionsForChosenAsset } from './useNonExpiredOptionExpirations';

/**
 * return expiration timestamps where there are at least 3 options available.
 */
export const useValidOptionExpirations = () => {
  const options = useNonExpiredOptionsForChosenAsset();
  return useMemo(() => {
    const expirationMap = options.reduce((acc, option) => {
      const expirationStr = option.expirationUnixTimestamp.toString();
      acc[expirationStr] = (acc[expirationStr] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(expirationMap)
      .filter((entry) => entry[1] > 2)
      .map((entry) => new BN(entry[0]))
      .sort((a, b) => a.sub(b).toNumber());
  }, [options]);
};
