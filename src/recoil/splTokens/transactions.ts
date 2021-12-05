import { MintInfo } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { useRecoilTransaction_UNSTABLE } from 'recoil';
import { splTokenMintInfoList, splTokenMintInfoMap } from '.';

export const useUpsertSPLTokenMintInfo = () =>
  useRecoilTransaction_UNSTABLE<[mint: PublicKey | string, mintInfo: MintInfo]>(
    ({ set }) =>
      (mint, mintInfo) => {
        const mintStr = typeof mint === 'string' ? mint : mint.toString();
        set(splTokenMintInfoMap(mintStr), mintInfo);
        set(splTokenMintInfoList, (curVal) => [...curVal, mintStr]);
      },
    [],
  );
