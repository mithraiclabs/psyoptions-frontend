import { BN } from 'bn.js';
import { useMemo } from 'react';
import { useFormState } from '../../context/SimpleUIContext';
import { useNonExpiredOptionsForChosenAsset } from './useNonExpiredOptionExpirations';

/**
 * Given the asset, contract size, and expiration, return all options filtered for such criteria.
 */
export const useOptionsForExpiration = () => {
  const { expirationUnixTimestamp } = useFormState();
  const options = useNonExpiredOptionsForChosenAsset();

  return useMemo(() => {
    const expiration = new BN(expirationUnixTimestamp);
    return options.filter((option) =>
      option.expirationUnixTimestamp.eq(expiration),
    );
  }, [expirationUnixTimestamp, options]);
};
