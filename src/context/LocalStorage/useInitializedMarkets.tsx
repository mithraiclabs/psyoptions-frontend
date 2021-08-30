import React, { createContext, useContext } from 'react';
import useLocalStorageState from 'use-local-storage-state';
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

const InitializedMarketsContext = createContext<
  [InitializedMarketMeta[], UpdateState<InitializedMarketMeta[]>, boolean]
>([[], (() => {}) as unknown as UpdateState<InitializedMarketMeta[]>, true]);

export const InitializedMarketsProvider: React.FC = ({ children }) => {
  const state = useLocalStorageState<InitializedMarketMeta[]>(
    'initialized-markets',
    [],
  );

  return (
    <InitializedMarketsContext.Provider value={state}>
      {children}
    </InitializedMarketsContext.Provider>
  );
};

export const useInitializedMarkets = (): [
  InitializedMarketMeta[],
  UpdateState<InitializedMarketMeta[]>,
  boolean,
] => useContext(InitializedMarketsContext);
