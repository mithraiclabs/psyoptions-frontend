import { Market } from '@mithraic-labs/psyoptions';
import { PublicKey } from '@solana/web3.js';
import { useCallback } from 'react';
import useConnection from '../useConnection';

export const useCheckIfMarketExists = (): ((obj: {
  expirationUnixTimestamp: number;
  quoteAmountPerContract: number;
  quoteAssetMintKey: PublicKey;
  underlyingAmountPerContract: number;
  underlyingAssetMintKey: PublicKey;
}) => Promise<boolean>) => {
  const { connection, endpoint } = useConnection();

  return useCallback(
    async ({
      expirationUnixTimestamp,
      quoteAmountPerContract,
      quoteAssetMintKey,
      underlyingAmountPerContract,
      underlyingAssetMintKey,
    }) => {
      const [optionMarketKey] = await Market.getDerivedAddressFromParams({
        programId: new PublicKey(endpoint.programId),
        underlyingAssetMintKey,
        quoteAssetMintKey,
        underlyingAmountPerContract,
        quoteAmountPerContract,
        expirationUnixTimestamp,
      });

      const accountInfo = await connection.getAccountInfo(
        optionMarketKey,
        'recent',
      );

      return !!accountInfo;
    },
    [connection, endpoint.programId],
  );
};
