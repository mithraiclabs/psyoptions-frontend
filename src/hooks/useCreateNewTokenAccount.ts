import { useCallback } from 'react';
import { initializeTokenAccountTx } from '../utils/token';
import useConnection from './useConnection';
import useNotifications from './useNotifications';
import { useConnectedWallet } from '@saberhq/use-solana';
import useSendTransaction from './useSendTransaction';
import { useSolanaMeta } from '../context/SolanaMetaContext';

export const useCreateNewTokenAccount = () => {
  const { connection } = useConnection();
  const wallet = useConnectedWallet();
  const { pushErrorNotification } = useNotifications();
  const { splTokenAccountRentBalance } = useSolanaMeta();
  const { sendTransaction } = useSendTransaction();

  return useCallback(
    async (mintKey, accountName) => {
      if (!wallet?.publicKey || !splTokenAccountRentBalance) return;

      try {
        // TODO: maybe we can send a name for this account in the wallet too, would be nice
        const { transaction: tx, newTokenAccount } =
          await initializeTokenAccountTx({
            connection,
            payerKey: wallet.publicKey,
            mintPublicKey: mintKey,
            owner: wallet.publicKey,
            rentBalance: splTokenAccountRentBalance,
          });

        sendTransaction({
          transaction: tx,
          wallet,
          connection,
          sendingMessage: `Sending: Create ${accountName} Account`,
          successMessage: `Confirmed: Create ${accountName} Account`,
        });
        return newTokenAccount.publicKey.toString();
      } catch (err) {
        pushErrorNotification(err);
      }
    },
    [
      connection,
      pushErrorNotification,
      sendTransaction,
      splTokenAccountRentBalance,
      wallet,
    ],
  );
};
