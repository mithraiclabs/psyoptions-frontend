import { useRecoilValue } from 'recoil';
import { underlyingAmountPerContract, underlyingMint } from '../recoil';
import { useNormalizeAmountOfMint } from './useNormalizeAmountOfMint';

export const useNormalizedContractSize = (): number => {
  const _underlyingMint = useRecoilValue(underlyingMint);
  const normalizeAmount = useNormalizeAmountOfMint(_underlyingMint);
  const _underlyingAmountPerContract = useRecoilValue(
    underlyingAmountPerContract,
  );

  return normalizeAmount(_underlyingAmountPerContract);
};
