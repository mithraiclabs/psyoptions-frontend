import { useMemo } from 'react';
import { OptionMarket } from '../../types';
import useOptionsMarkets from '../useOptionsMarkets';

export const useOptionMarketByKey = (
  optionMarketUiKey: string | undefined,
): OptionMarket | undefined => {
  const { marketsByUiKey } = useOptionsMarkets();

  return useMemo(
    () => marketsByUiKey[optionMarketUiKey ?? ''],
    [marketsByUiKey, optionMarketUiKey],
  );
};
