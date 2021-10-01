import Box from '@material-ui/core/Box';
import { OptionMarketWithKey } from '@mithraic-labs/psy-american';
import React, { useMemo } from 'react';
import { useTokenMintInfo } from '../../../hooks/useTokenMintInfo';

// TODO update to pull info/logo of mint from token registry
// We could probably rely on the spl-token-registry if we're
// moving away from market meta package
export const MintInfo: React.VFC<{
  option: OptionMarketWithKey | null;
  size: number | null;
}> = ({ option, size }) => {
  const underlyingMintInfo = useTokenMintInfo(option?.underlyingAssetMint);
  const quoteMintInfo = useTokenMintInfo(option?.quoteAssetMint);
  const date = useMemo(
    () => new Date((option?.expirationUnixTimestamp?.toNumber() ?? 0) * 1000),
    [option?.expirationUnixTimestamp],
  );

  if (!option || !size) {
    return null;
  }

  const normalizedUnderlyingPerContract =
    option.underlyingAmountPerContract.toNumber() *
    10 ** -(underlyingMintInfo?.decimals ?? 0);
  const normalizedQuotePerContract =
    option.quoteAmountPerContract.toNumber() *
    10 ** -(quoteMintInfo?.decimals ?? 0);
  const normalizedUnderlyingAmount = normalizedUnderlyingPerContract * size;
  const strike = normalizedQuotePerContract / normalizedUnderlyingPerContract;

  return (
    <Box flexDirection="column">
      <Box>
        Underlying mint:
        {option.underlyingAssetMint.toString()}
      </Box>
      <Box>
        Quote mint:
        {option.quoteAssetMint.toString()}
      </Box>
      <Box>Expiration {date.toISOString()}</Box>
      <Box>Strike: {strike}</Box>
      <Box>Underlying to lock: {normalizedUnderlyingAmount}</Box>
    </Box>
  );
};
