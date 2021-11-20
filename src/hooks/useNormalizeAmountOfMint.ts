import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { useCallback } from 'react';
import { useTokenMintInfo } from './useTokenMintInfo';

export const useNormalizeAmountOfMint = (
  mint: PublicKey | null,
): ((num: BN) => number) => {
  const mintInfo = useTokenMintInfo(mint);

  return useCallback(
    (num: BN) => {
      if (!num) {
        return 0;
      }
      return num.toNumber() * 10 ** -(mintInfo?.decimals ?? 0);
    },
    [mintInfo?.decimals],
  );
};
