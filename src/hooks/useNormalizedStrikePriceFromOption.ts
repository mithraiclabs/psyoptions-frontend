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
 *
 * @param `optionKey`
 * @param `overrideIsCall` is an optional paramter to specify whether
 * the option should be treated as a Call. If not specified, the hook
 * will use the `underlyingMint` recoil state to determine if it's a Call/Put.
 */
export const useNormalizedStrikePriceFromOption = (
  optionKey: string,
  overrideIsCall?: boolean,
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
    // eslint-disable-next-line eqeqeq
    if (!option) {
      return ZERO_BIGNUM;
    }
    let isCall = overrideIsCall;
    // eslint-disable-next-line eqeqeq
    if (isCall == undefined) {
      // if isCall is undefined or null, fallback to checking the
      // `underlyingMint`.
      isCall =
        !_underlyingMint || option.underlyingAssetMint.equals(_underlyingMint);
    }
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
    overrideIsCall,
  ]);
};
