import { BN } from '@project-serum/anchor';
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, Signer } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import useConnection from './useConnection';
import useNotifications from './useNotifications';

const ZERO_BN = new BN(0);

export const useOptionVaultAmounts = (
  quoteMint: PublicKey,
  quoteVaultKey: PublicKey,
  underlyingMint: PublicKey,
  underlyingVaultKey: PublicKey,
): [BN, BN] => {
  const { pushNotification } = useNotifications();
  const { connection } = useConnection();
  const [vaultAmounts, setVaultAmounts] = useState<[BN, BN]>([
    ZERO_BN,
    ZERO_BN,
  ]);

  useEffect(() => {
    if (!connection) {
      return () => {};
    }
    let quoteVaultSubscriptionId: number;
    let underlyingVaultSubscriptionId: number;
    (async () => {
      try {
        const quoteToken = new Token(
          connection,
          quoteMint,
          TOKEN_PROGRAM_ID,
          null as unknown as Signer,
        );
        const underlyingToken = new Token(
          connection,
          underlyingMint,
          TOKEN_PROGRAM_ID,
          null as unknown as Signer,
        );
        const [quoteVaultAccount, underlyingVaultAccount] = await Promise.all([
          quoteToken.getAccountInfo(quoteVaultKey),
          underlyingToken.getAccountInfo(underlyingVaultKey),
        ]);
        setVaultAmounts([
          quoteVaultAccount.amount,
          underlyingVaultAccount.amount,
        ]);

        quoteVaultSubscriptionId = connection.onAccountChange(
          quoteVaultKey,
          (_account) => {
            const listenerAccountInfo = AccountLayout.decode(_account.data);
            console.log('listenerAccountInfo ', listenerAccountInfo);
            const amountBuf = Buffer.from(listenerAccountInfo.amount);
            const amountNum = amountBuf.readUIntLE(0, 8);
            // eslint-disable-next-line new-cap
            const amount = new BN(amountNum);
            setVaultAmounts((balances) => [amount, balances[1]]);
          },
        );
        underlyingVaultSubscriptionId = connection.onAccountChange(
          underlyingVaultKey,
          (_account) => {
            const listenerAccountInfo = AccountLayout.decode(_account.data);
            const amountBuf = Buffer.from(listenerAccountInfo.amount);
            const amountNum = amountBuf.readUIntLE(0, 8);
            // eslint-disable-next-line new-cap
            const amount = new BN(amountNum);
            setVaultAmounts((balances) => [balances[0], amount]);
          },
        );
      } catch (err) {
        pushNotification({
          severity: 'error',
          message: `${err}`,
        });
      }
    })();

    return () => {
      if (quoteVaultSubscriptionId) {
        connection.removeAccountChangeListener(quoteVaultSubscriptionId);
      }
      if (underlyingVaultSubscriptionId) {
        connection.removeAccountChangeListener(underlyingVaultSubscriptionId);
      }
    };
  }, [
    connection,
    pushNotification,
    quoteMint,
    quoteVaultKey,
    underlyingMint,
    underlyingVaultKey,
  ]);

  return vaultAmounts;
};
