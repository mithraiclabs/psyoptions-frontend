import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { optionsMap } from '../recoil';
import { useNormalizeAmountOfMintBN } from './useNormalizeAmountOfMintBN';
import { useOptionIsCall } from './useOptionIsCall';

/**
 * Get the contract size from an option. The option is considered
 * a Call when the `underlyingAsset` is NOT USDC and hence will use
 * the underlyingAmountPerContract.
 */
export const useOptionContractSize = (optionKey: PublicKey): BigNumber => {
  const isCall = useOptionIsCall(optionKey);
  const option = useRecoilValue(optionsMap(optionKey.toString()));
  const normalizeQuoteAmountBN = useNormalizeAmountOfMintBN(
    option?.quoteAssetMint ?? null,
  );
  const normalizeUnderlyingAmountBN = useNormalizeAmountOfMintBN(
    option?.underlyingAssetMint ?? null,
  );

  return useMemo(() => {
    if (!option) {
      return new BigNumber(0);
    }

    if (isCall) {
      return normalizeUnderlyingAmountBN(option.underlyingAmountPerContract);
    }
    return normalizeQuoteAmountBN(option.quoteAmountPerContract);
  }, [isCall, normalizeQuoteAmountBN, normalizeUnderlyingAmountBN, option]);
};
