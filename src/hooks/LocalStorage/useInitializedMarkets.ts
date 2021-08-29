import { createLocalStorageStateHook } from 'use-local-storage-state';
import { UpdateState } from 'use-local-storage-state/src/useLocalStorageStateBase';

export type InitializedMarketMeta = {
  expiration: number;
  optionMarketAddress: string;
  optionContractMintAddress: string;
  optionWriterTokenMintAddress: string;
  quoteAssetMint: string;
  quoteAssetPoolAddress: string;
  underlyingAssetMint: string;
  underlyingAssetPoolAddress: string;
  underlyingAssetPerContract: string;
  quoteAssetPerContract: string;
  serumMarketAddress?: string;
  serumProgramId?: string;
  psyOptionsProgramId: string;
};

export const useInitializedMarkets = (): [
  InitializedMarketMeta[],
  UpdateState<InitializedMarketMeta[]>,
  boolean,
] =>
  createLocalStorageStateHook<InitializedMarketMeta[]>(
    'initialized-markets',
    [],
  )();
