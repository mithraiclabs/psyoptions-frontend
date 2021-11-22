import { BigNumber } from 'bignumber.js';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { optionsMap, underlyingMint } from '../recoil';
import { useNormalizeAmountOfMintBN } from './useNormalizeAmountOfMintBN';

const ZERO_BIGNUM = new BigNumber(0);
const TWO_BIGNUM = new BigNumber(2);

/**
 * Calculate the strike price of an option using the selected underlying
 * and quote assets.
 */
export const useNormalizedStrikePriceFromOption = (
  optionKey: string,
): BigNumber => {
  const option = useRecoilValue(optionsMap(optionKey));
  const _underlyingMint = useRecoilValue(underlyingMint);
  const normalizeQuoteAmountBN = useNormalizeAmountOfMintBN(
    option?.quoteAssetMint ?? null,
  );
  const normalizeUnderlyingAmountBN = useNormalizeAmountOfMintBN(
    option?.underlyingAssetMint ?? null,
  );

  return useMemo(() => {
    if (!option || !_underlyingMint) {
      return ZERO_BIGNUM;
    }
    const isCall = option.underlyingAssetMint.equals(_underlyingMint);
    const normalizedUnderlyingAmount = isCall
      ? normalizeUnderlyingAmountBN(option.underlyingAmountPerContract)
      : normalizeQuoteAmountBN(option.quoteAmountPerContract);
    const normalizedQuoteAmount = isCall
      ? normalizeQuoteAmountBN(option.quoteAmountPerContract)
      : normalizeUnderlyingAmountBN(option.underlyingAmountPerContract);

    // Must square and divide by the normalized contract size
    // in order to get the appropriate strike price
    const strike = normalizedUnderlyingAmount
      .multipliedBy(normalizedQuoteAmount)
      .div(normalizedUnderlyingAmount.pow(TWO_BIGNUM));
    return strike;
  }, [
    _underlyingMint,
    normalizeQuoteAmountBN,
    normalizeUnderlyingAmountBN,
    option,
  ]);
};
