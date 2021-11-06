import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import BN from 'bn.js';
import { useCallback } from 'react';
import { useTokenMintInfo } from './useTokenMintInfo';

const TEN_BIGNUM = new BigNumber(10);

export const useNormalizeAmountOfMintBN = (
  mint: PublicKey | null,
): ((num: BN) => BigNumber) => {
  const mintInfo = useTokenMintInfo(mint);

  return useCallback(
    (num: BN) => {
      const bigNum = new BigNumber(num.toString());
      const mintDecimalsBIGNUM = new BigNumber(mintInfo?.decimals ?? 0);
      return bigNum.multipliedBy(TEN_BIGNUM.pow(mintDecimalsBIGNUM.negated()));
    },
    [mintInfo?.decimals],
  );
};
