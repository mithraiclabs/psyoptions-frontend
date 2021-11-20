import { useMemo } from 'react';
import { ClusterEnv, Token, Tokens } from '@mithraic-labs/psy-token-registry';
import { ClusterName } from '../types';
import useConnection from './useConnection';
import { PublicKey } from '@solana/web3.js';

export const useNetworkTokens = (): ClusterEnv => {
  const { endpoint } = useConnection();

  return useMemo(() => {
    switch (endpoint?.name ?? '') {
      case ClusterName.mainnet:
        return Tokens.mainnet;
      case ClusterName.devnet:
        return Tokens.devnet;
      default:
        return {};
    }
  }, [endpoint?.name]);
};

export const useTokenByMint = (mint: PublicKey | string): Token | undefined => {
  const tokens = useNetworkTokens();
  const key = typeof mint === 'string' ? mint : mint.toString();

  return tokens[key];
};
