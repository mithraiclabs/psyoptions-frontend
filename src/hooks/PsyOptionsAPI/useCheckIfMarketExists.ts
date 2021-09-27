import {
  deriveOptionKeyFromParams,
  getOptionByKey,
  OptionMarketWithKey,
} from '@mithraic-labs/psy-american';
import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { useCallback } from 'react';
import { useAmericanPsyOptionsProgram } from '../useAmericanPsyOptionsProgram';

export const useCheckIfMarketExists = (): ((obj: {
  expirationUnixTimestamp: BN;
  quoteAmountPerContract: BN;
  quoteAssetMintKey: PublicKey;
  underlyingAmountPerContract: BN;
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
      const [optionMarketKey] = await deriveOptionKeyFromParams({
        programId: program.programId,
        underlyingMint: underlyingAssetMintKey,
        quoteMint: quoteAssetMintKey,
        underlyingAmountPerContract,
        quoteAmountPerContract,
        expirationUnixTimestamp,
      });

      return getOptionByKey(program, optionMarketKey);
    },
    [program],
  );
};
