import { MintInfo } from '@solana/spl-token';
import { atom, atomFamily } from 'recoil';

/**
 * Store the MintInfo meta data for SPL Tokens.
 */
export const splTokenMintInfoMap = atomFamily<MintInfo | null, string>({
  key: 'mintInfoMap',
  default: null,
});

/**
 * Array of strings representing all of the splTokenMintInfos within `splTokenMintInfoMap` atomFamily.
 */
export const splTokenMintInfoList = atom<string[]>({
  key: 'splTokenMintInfoList',
  default: [],
});
