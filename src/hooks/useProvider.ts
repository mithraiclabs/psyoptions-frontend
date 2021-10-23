import { Provider, Wallet } from '@project-serum/anchor';
import { useMemo } from 'react';
import useConnection from './useConnection';
import { useConnectedWallet } from '@saberhq/use-solana';
import { Keypair } from '@solana/web3.js';

const throwawayKeypair = new Keypair();
const defaultWallet = new Wallet(throwawayKeypair);

/**
 * Get provider based on current RPC connection and wallet.
 *
 * @returns Provider | null
 */
export const useProvider = (): Provider | null => {
  const { connection } = useConnection();
  const wallet = useConnectedWallet();

  return useMemo(() => {
    if (connection) {
      // must default to a wallet so provider exists.
      // Not sure if this is best practice, open to suggestions.
      return new Provider(connection, wallet ?? defaultWallet, {});
    }
    return null;
  }, [connection, wallet]);
};
