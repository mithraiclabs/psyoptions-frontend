import { MintInfo } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { useRecoilValue } from 'recoil';
import { optionsMap } from '../recoil';
import { useTokenMintInfo } from './useTokenMintInfo';

type OptionalMintInfo = MintInfo | null;

/**
 * Get MintInfo for the underlying & quote assets for the specified option.
 * Will be null if the data is not readily available and needs to be
 * fetched.
 */
export const useOptionAssetMintInfos = (
  optionKey: PublicKey,
): [OptionalMintInfo, OptionalMintInfo] => {
  const option = useRecoilValue(optionsMap(optionKey.toString() ?? ''));
  const optionUnderlyingMintInfo = useTokenMintInfo(
    option?.underlyingAssetMint,
  );
  const optionQuoteMintInfo = useTokenMintInfo(option?.quoteAssetMint);

  return [optionUnderlyingMintInfo, optionQuoteMintInfo];
};
