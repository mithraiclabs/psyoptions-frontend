import * as Sentry from '@sentry/react';
import React, { createContext, useEffect, useState, useCallback } from 'react';
import useNotifications from '../hooks/useNotifications';
import {
  useConnectedWallet,
  WalletType,
  WALLET_PROVIDERS,
} from '@saberhq/use-solana';
import useConnection from '../hooks/useConnection';

// @ts-ignore
delete WALLET_PROVIDERS[WalletType.SolflareExtension];

type WalletInfoContext = {
  balance: number | null;
};

const WalletInfoContext = createContext<WalletInfoContext>({
  balance: null,
});

const WalletInfoProvider: React.FC = ({ children }) => {
  const { connection } = useConnection();
  const { pushNotification } = useNotifications();
  const [balance, setBalance] = useState<number | null>(null);
  const wallet = useConnectedWallet();

  const refetchSOL = useCallback(async () => {
    let subscription: number;

    if (wallet?.publicKey && connection) {
      try {
        setBalance(await connection.getBalance(wallet.publicKey));
        subscription = connection.onAccountChange(
          wallet.publicKey,
          (account) => {
            setBalance(account.lamports);
          },
        );
      } catch (err) {
        console.error(err);
        Sentry.captureException(err);
        pushNotification({
          severity: 'error',
          message: `${err}`,
        });
      }
    }

    return () => {
      if (subscription) {
        connection.removeAccountChangeListener(subscription);
      }
    };
  }, [wallet?.publicKey, connection, pushNotification]);

  useEffect(() => {
    void refetchSOL();
  }, [refetchSOL]);

  // #TODO: Eager connect to phantom on initial load if user has allowed it

  const state = {
    balance,
  };

  return (
    <WalletInfoContext.Provider value={state}>
      {children}
    </WalletInfoContext.Provider>
  );
};

export { WalletInfoContext, WalletInfoProvider };
