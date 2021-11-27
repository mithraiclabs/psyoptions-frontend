import { BN } from '@project-serum/anchor';
import { MintInfo, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, Signer } from '@solana/web3.js';
import { useEffect, useMemo, useState } from 'react';
import useAssetList from './useAssetList';
import useConnection from './useConnection';
import useNotifications from './useNotifications';

/**
 * Get MintInfo for an arbitray public key
 */
export const useTokenMintInfo = (
  mint: PublicKey | null | undefined,
): MintInfo | null => {
  const { connection } = useConnection();
  const { pushErrorNotification } = useNotifications();
  const { tokenMap } = useAssetList();
  const token = useMemo(
    () =>
      mint && !mint.equals(PublicKey.default)
        ? new Token(
            connection,
            mint,
            TOKEN_PROGRAM_ID,
            null as unknown as Signer,
          )
        : null,
    [connection, mint],
  );
  const [mintInfo, setMintInfo] = useState<MintInfo | null>(null);

  useEffect(() => {
    if (!token || !mint || mint.equals(PublicKey.default)) {
      return;
    }
    // Flag for keeping track of when the effect has been cleaned up.
    // This often happens when the mint changes and likely as a result
    // of the network changing.
    let bail = false;
    const tokenInMemory = tokenMap[mint?.toString() ?? ''];
    if (tokenInMemory) {
      // Maybe we don't need this optimization, but if the token is within
      // our tokenMap we can short circuit the RPC call.
      setMintInfo({
        mintAuthority: null,
        supply: new BN(0),
        decimals: tokenInMemory.decimals,
        isInitialized: true,
        freezeAuthority: null,
      });
      return;
    }
    (async () => {
      try {
        // TODO cache in Recoil
        const _mintInfo = await token.getMintInfo();
        if (!bail) {
          setMintInfo(_mintInfo);
        }
      } catch (err) {
        if (!bail) {
          pushErrorNotification(err);
        }
      }
    })();

    return () => {
      bail = true;
    };
  }, [mint, pushErrorNotification, token, tokenMap]);

  return mintInfo;
};
