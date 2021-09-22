import { Market } from '@mithraic-labs/psyoptions';
import {
  getOptionByKey,
  OptionMarketWithKey,
} from '@mithraic-labs/psy-american';
import { PublicKey } from '@solana/web3.js';
import { useCallback } from 'react';
import { useAmericanPsyOptionsProgram } from '../useAmericanPsyOptionsProgram';

export const useCheckIfMarketExists = (): ((obj: {
  expirationUnixTimestamp: number;
  quoteAmountPerContract: number;
  quoteAssetMintKey: PublicKey;
  underlyingAmountPerContract: number;
  underlyingAssetMintKey: PublicKey;
}) => Promise<OptionMarketWithKey | null>) => {
  const program = useAmericanPsyOptionsProgram();

  return useCallback(
    async ({
      expirationUnixTimestamp,
      quoteAmountPerContract,
      quoteAssetMintKey,
      underlyingAmountPerContract,
      underlyingAssetMintKey,
    }) => {
      const [optionMarketKey] = await Market.getDerivedAddressFromParams({
        programId: program.programId,
        underlyingAssetMintKey,
        quoteAssetMintKey,
        underlyingAmountPerContract,
        quoteAmountPerContract,
        expirationUnixTimestamp,
      });

      return getOptionByKey(program, optionMarketKey);
    },
    [program],
  );
};
