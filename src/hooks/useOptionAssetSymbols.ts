import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { optionsMap } from '../recoil';
import { useOptionAssetValues } from './useOptionAssetValues';

/**
 * Hook to encapsulate the logic of getting the asset symbols for the
 * underlying and quote asset of the option.
 */
export const useOptionAssetSymbols = (
  optionKey: PublicKey,
): [string, string] => {
  const option = useRecoilValue(optionsMap(optionKey.toString()));
  const [optionUnderlyingAsset, optionQuoteAsset] =
    useOptionAssetValues(optionKey);

  return useMemo(
    () => [
      optionUnderlyingAsset?.symbol ??
        option?.underlyingAssetMint.toString() ??
        '',
      optionQuoteAsset?.symbol.toString() ??
        option?.quoteAssetMint.toString() ??
        '',
    ],
    [
      option?.quoteAssetMint,
      option?.underlyingAssetMint,
      optionQuoteAsset?.symbol,
      optionUnderlyingAsset?.symbol,
    ],
  );
};
