import { useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useRecoilValue } from 'recoil';
import { ClusterEnv, Token, Tokens } from '@mithraic-labs/psy-token-registry';
import { ClusterName } from '../types';
import { activeNetwork } from '../recoil';

export const useNetworkTokens = (): ClusterEnv => {
  const endpoint = useRecoilValue(activeNetwork);

  return useMemo(() => {
    switch (endpoint?.name ?? '') {
      case ClusterName.custom:
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
