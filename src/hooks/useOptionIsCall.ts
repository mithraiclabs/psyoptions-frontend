import { PublicKey } from '@solana/web3.js';
import { useRecoilValue } from 'recoil';
import { optionsMap } from '../recoil';
import useAssetList from './useAssetList';

/**
 * Determine whether or not the option is a Call or Put.
 * Note: this should be used in contexts where we do not
 * know the appropriate underlying asset (i.e. showing
 * all options instead of just BTC options).
 */
export const useOptionIsCall = (optionKey: PublicKey): boolean => {
  const { USDCPublicKey } = useAssetList();
  const option = useRecoilValue(optionsMap(optionKey.toString()));

  if (!USDCPublicKey || !option) {
    // default to true
    return true;
  }

  return !option.underlyingAssetMint.equals(USDCPublicKey);
};
