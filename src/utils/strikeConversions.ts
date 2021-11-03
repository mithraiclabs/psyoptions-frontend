import BigNumber from 'bignumber.js';
import { Asset } from '../types';

/**
 * Given a readable strikePrice and the underlyingAmountPerContract in the U64 (BigNumber)
 * representation, calculate the quoteAssetsPerContract
 */
export const convertStrikeToAmountsPer = (
  strikePice: BigNumber,
  underlyingAmountPerContract: BigNumber,
  underlyingAsset: Asset,
  quoteAsset: Asset,
): BigNumber => {
  const quoteDecimals = new BigNumber(quoteAsset.decimals);
  const quoteDecimalFactor = new BigNumber(10).pow(quoteDecimals);
  const quotePerUnderlying = strikePice.multipliedBy(quoteDecimalFactor);

  const underlyingDecimals = new BigNumber(underlyingAsset.decimals);
  const underlyingDecimalFactor = new BigNumber(10).pow(underlyingDecimals);
  const wholeUnderlyingPerContract = underlyingAmountPerContract.div(
    underlyingDecimalFactor,
  );

  return quotePerUnderlying.multipliedBy(wholeUnderlyingPerContract);
};

/**
 * Given the U64 (BigNumber) representation of the assets for the contract and the asset's meta
 * data, calculate and return the strike price.
 *
 * Note: BigNumber is used here because it handles decimals during division
 */
export const convertAmountsPerToStrike = (
  underlyingAmountPerContract: BigNumber,
  quoteAmountPerContract: BigNumber,
  quoteAsset: Asset,
  underlyingAsset: Asset,
): BigNumber => {
  const quoteDecimals = new BigNumber(quoteAsset.decimals);
  const quoteDecimalFactor = new BigNumber(10).pow(quoteDecimals);
  const wholeQuotePerContract = quoteAmountPerContract.div(quoteDecimalFactor);
  const underlyingDecimals = new BigNumber(underlyingAsset.decimals);
  const underlyingDecimalFactor = new BigNumber(10).pow(underlyingDecimals);
  const wholeUnderlyingPerContract = underlyingAmountPerContract.div(
    underlyingDecimalFactor,
  );
  return wholeQuotePerContract.div(wholeUnderlyingPerContract);
};
