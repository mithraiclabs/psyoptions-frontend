import { Token } from '@mithraic-labs/psy-token-registry';
import { PublicKey } from '@solana/web3.js';
import { useRecoilValue } from 'recoil';
import { optionsMap } from '../recoil';
import { useTokenByMint } from './useNetworkTokens';

type OptionalToken = Token | undefined;

/**
 * Get meta data for the underlying & quote assets for the specified option.
 * Will be undefined when the token is not in the Psy Token Registry.
 */
export const useOptionAssetValues = (
  optionKey: PublicKey,
): [OptionalToken, OptionalToken] => {
  const option = useRecoilValue(optionsMap(optionKey.toString() ?? ''));
  const optionUnderlyingAsset = useTokenByMint(
    option?.underlyingAssetMint ?? '',
  );
  const optionQuoteAsset = useTokenByMint(option?.quoteAssetMint ?? '');

  return [optionUnderlyingAsset, optionQuoteAsset];
};
