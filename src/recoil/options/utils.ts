import { OptionMarket } from '@mithraic-labs/psy-american';

export const getOptionsByMarketsPageParamsKey = (
  option: OptionMarket,
): string =>
  `${option.underlyingAssetMint}-${option.quoteAssetMint}-${option.expirationUnixTimestamp}-${option.underlyingAmountPerContract}`;
