import { PublicKey } from '@solana/web3.js';
import { useCallback, useContext } from 'react';
import { WalletContext } from '../context/WalletContext';
import WalletAdapter from '../utils/wallet/walletAdapter';

const useWallet = (): {
  balance: number;
  wallet: WalletAdapter | null;
  connect: (walletAdapter: WalletAdapter, args: unknown) => void;
  disconnect: () => void;
  connected: boolean;
  loading: boolean;
  pubKey: PublicKey | null;
} => {
  const {
    balance,
    loading,
    setLoading,
    wallet,
    setWallet,
    connected,
    setConnected,
    pubKey,
    setPubKey,
  } = useContext(WalletContext);

  // Reset state in case user is changing wallets
  const connect = useCallback(
    async (walletAdapter: WalletAdapter, args: unknown) => {
      setPubKey(null);
      setConnected(false);
      setLoading(true);

      setWallet(walletAdapter);

      walletAdapter.on('disconnect', () => {
        setConnected(false);
        setPubKey(null);
        console.log('Disconnected');
      });

      walletAdapter.on('connect', (key) => {
        setLoading(false);
        if (key) {
          setConnected(true);
          setPubKey(key);
          console.log('connected');
        }
      });

      await walletAdapter.connect(args);
    },
    [setConnected, setLoading, setPubKey, setWallet],
  );

  const disconnect = () => {
    wallet?.disconnect();
    setPubKey(null);
    setConnected(false);
  };

  return {
    balance,
    wallet,
    connect,
    disconnect,
    connected,
    loading,
    pubKey,
  };
};

export default useWallet;
