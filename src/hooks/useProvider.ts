import { Provider } from '@project-serum/anchor';
import { useMemo } from 'react';
import useConnection from './useConnection';
import { useConnectedWallet } from "@saberhq/use-solana";

/**
 * Get provider based on current RPC connection and wallet.
 *
 * @returns Provider | null
 */
export const useProvider = (): Provider | null => {
  const { connection } = useConnection();
  const wallet = useConnectedWallet();

  return useMemo(() => {
    if (wallet && connection) {
      return new Provider(connection, wallet, {});
    }
    return null;
  }, [connection, wallet]);
};
