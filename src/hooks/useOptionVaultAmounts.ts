import { Token, TOKEN_PROGRAM_ID, u64 } from '@solana/spl-token';
import { PublicKey, Signer } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import useConnection from './useConnection';
import useNotifications from './useNotifications';

// eslint-disable-next-line new-cap
const ZERO_U64 = new u64(0);

export const useOptionVaultAmounts = (
  quoteMint: PublicKey,
  quoteVaultKey: PublicKey,
  underlyingMint: PublicKey,
  underlyingVaultKey: PublicKey,
): [u64, u64] => {
  const { pushNotification } = useNotifications();
  const { connection } = useConnection();
  const [vaultAmounts, setVaultAmounts] = useState<[u64, u64]>([
    ZERO_U64,
    ZERO_U64,
  ]);

  useEffect(() => {
    if (!connection) {
      return;
    }
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
      } catch (err) {
        pushNotification({
          severity: 'error',
          message: `${err}`,
        });
      }
    })();
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
