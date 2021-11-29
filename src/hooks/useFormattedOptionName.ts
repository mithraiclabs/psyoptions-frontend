import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { optionsMap } from '../recoil';
import { formatExpirationTimestampDate } from '../utils/format';
import { useTokenByMint } from './useNetworkTokens';
import { useOptionIsCall } from './useOptionIsCall';

/**
 * Format option to the following structure `BTC | 24 Sep 2021 | call`
 */
export const useFormattedOptionName = (optionKey: PublicKey): string => {
  const option = useRecoilValue(optionsMap(optionKey.toString()));
  const isCall = useOptionIsCall(optionKey);
  const optionUnderlyingAsset = useTokenByMint(
    option?.underlyingAssetMint ?? '',
  );
  const optionQuoteAsset = useTokenByMint(option?.quoteAssetMint ?? '');
  return useMemo(() => {
    const optionUnderlyingAssetSymbol =
      optionUnderlyingAsset?.symbol ??
      option?.underlyingAssetMint.toString() ??
      '';
    const optionQuoteAssetSymbol =
      optionQuoteAsset?.symbol ?? option?.quoteAssetMint.toString() ?? '';
    return `${
      isCall ? optionQuoteAssetSymbol : optionUnderlyingAssetSymbol
    } | ${formatExpirationTimestampDate(
      option?.expirationUnixTimestamp.toNumber() ?? 0,
    )} | ${isCall ? 'Call' : 'Put'}`;
  }, [
    isCall,
    option?.expirationUnixTimestamp,
    option?.quoteAssetMint,
    option?.underlyingAssetMint,
    optionQuoteAsset?.symbol,
    optionUnderlyingAsset?.symbol,
  ]);
};
