import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { useFormState } from '../../context/SimpleUIContext';
import { selectAllNonExpiredOptions } from '../../recoil';
import useAssetList from '../useAssetList';
import { useTokenMintInfo } from '../useTokenMintInfo';

/**
 * Return non expired options based on the selected asset for the beginner UI.
 */
export const useNonExpiredOptionsForChosenAsset = () => {
  const { contractSize, direction, underlyingAssetMint } = useFormState();
  const { USDCPublicKey } = useAssetList();
  const nonExpiredOptions = useRecoilValue(selectAllNonExpiredOptions);
  const mintInfo = useTokenMintInfo(underlyingAssetMint);

  return useMemo(() => {
    const optionContractSize = new BN(
      contractSize * 10 ** (mintInfo?.decimals ?? 0),
    );
    return nonExpiredOptions.filter(
      (option) =>
        (direction === 'up' &&
          option.underlyingAmountPerContract.eq(optionContractSize) &&
          option.underlyingAssetMint.equals(
            underlyingAssetMint ?? PublicKey.default,
          ) &&
          option.quoteAssetMint.equals(USDCPublicKey ?? PublicKey.default)) ||
        (direction === 'down' &&
          option.quoteAmountPerContract.eq(optionContractSize) &&
          option.underlyingAssetMint.equals(
            USDCPublicKey ?? PublicKey.default,
          ) &&
          option.quoteAssetMint.equals(
            underlyingAssetMint ?? PublicKey.default,
          )),
    );
  }, [
    USDCPublicKey,
    contractSize,
    direction,
    mintInfo?.decimals,
    nonExpiredOptions,
    underlyingAssetMint,
  ]);
};
