import type BigNumber from 'bignumber.js';

import { useMemo } from 'react';
import { OptionMarket } from '../types';
import useOptionsMarkets from './useOptionsMarkets';

export const useOptionMarket = ({
  uAssetSymbol,
  qAssetSymbol,
  date,
  size,
  amountPerContract,
  quoteAmountPerContract,
}: {
  uAssetSymbol: string;
  qAssetSymbol: string;
  date: number;
  size: string;
  amountPerContract: BigNumber;
  quoteAmountPerContract: BigNumber;
}): OptionMarket | undefined => {
  const { marketsByUiKey } = useOptionsMarkets();

  return useMemo(
    () =>
      amountPerContract &&
      quoteAmountPerContract &&
      marketsByUiKey[
        `${date}-${uAssetSymbol}-${qAssetSymbol}-${size}-${amountPerContract.toString(
          10,
        )}/${quoteAmountPerContract.toString(10)}`
      ],
    [
      date,
      marketsByUiKey,
      qAssetSymbol,
      size,
      uAssetSymbol,
      amountPerContract,
      quoteAmountPerContract,
    ],
  );
};
