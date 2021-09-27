import { PublicKey } from '@solana/web3.js';
import useAssetList from './useAssetList';

/**
 * Extract the decimal number from the supported assets.
 */
export const useDecimalsForMint = (mint: PublicKey | string): number => {
  const { tokenMap } = useAssetList();
  const mintAddressStr = typeof mint === 'string' ? mint : mint.toString();

  return tokenMap[mintAddressStr]?.decimals ?? 0;
};
