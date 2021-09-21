import { useMemo } from 'react';
import { OptionMarket } from '../../types';
import useOptionsMarkets from '../useOptionsMarkets';

export const useOptionMarketByKey = (
  optionMarketUiKey: string | undefined,
): OptionMarket | undefined => {
  const { markets } = useOptionsMarkets();

  return useMemo(
    () => markets[optionMarketUiKey],
    [markets, optionMarketUiKey],
  );
};
