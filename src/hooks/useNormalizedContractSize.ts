import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { underlyingAmountPerContract, underlyingMint } from '../recoil';
import { useTokenMintInfo } from './useTokenMintInfo';

export const useNormalizedContractSize = (): number => {
  const _underlyingMint = useRecoilValue(underlyingMint);
  const _underlyingAmountPerContract = useRecoilValue(
    underlyingAmountPerContract,
  );
  const underlyingMintInfo = useTokenMintInfo(_underlyingMint);
  return useMemo(
    () =>
      _underlyingAmountPerContract.toNumber() *
      10 ** -(underlyingMintInfo?.decimals ?? 0),
    [_underlyingAmountPerContract, underlyingMintInfo?.decimals],
  );
};
