import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import BN from 'bn.js';
import { useCallback, useEffect } from 'react';
import { useTokenMintInfo } from './useTokenMintInfo';

const TEN_BIGNUM = new BigNumber(10);
const ZERO_BIGNUM = new BigNumber(10);

export const useNormalizeAmountOfMintBN = (
  mint: PublicKey | null | undefined,
): ((num: BN | undefined) => BigNumber) => {
  const mintInfo = useTokenMintInfo(mint);

  useEffect(() => {
    console.log(
      'TJ useNormalizeAmountOfMintBN changed',
      mint?.toString(),
      mintInfo,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mintInfo]);

  return useCallback(
    (num: BN | undefined) => {
      if (!num) {
        return ZERO_BIGNUM;
      }
      const bigNum = new BigNumber(num.toString());
      const mintDecimalsBIGNUM = new BigNumber(mintInfo?.decimals ?? 0);
      return bigNum.multipliedBy(TEN_BIGNUM.pow(mintDecimalsBIGNUM.negated()));
    },
    [mintInfo?.decimals],
  );
};
