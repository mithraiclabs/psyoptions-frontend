import { BN } from '@project-serum/anchor';
import { MintInfo, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, Signer } from '@solana/web3.js';
import { useEffect, useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { splTokenMintInfoMap } from '../recoil';
import { useUpsertSPLTokenMintInfo } from '../recoil/splTokens/transactions';
import useConnection from './useConnection';
import { useTokenByMint } from './useNetworkTokens';
import useNotifications from './useNotifications';

/**
 * Get MintInfo for an arbitray public key
 */
export const useTokenMintInfo = (
  mint: PublicKey | null | undefined,
): MintInfo | null => {
  const { connection } = useConnection();
  const { pushErrorNotification } = useNotifications();
  const psyRegistryToken = useTokenByMint(mint ?? '');
  const tokenMintInfo = useRecoilValue(
    splTokenMintInfoMap(mint?.toString() ?? ''),
  );
  const upsertSplTokenMintInfo = useUpsertSPLTokenMintInfo();
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

  useEffect(() => {
    if (!token || !mint || mint.equals(PublicKey.default) || tokenMintInfo) {
      return;
    }
    // Flag for keeping track of when the effect has been cleaned up.
    // This often happens when the mint changes and likely as a result
    // of the network changing.
    let bail = false;
    (async () => {
      try {
        const __mintInfo = await token.getMintInfo();
        if (!bail) {
          upsertSplTokenMintInfo(mint.toString(), __mintInfo);
        }
      } catch (err) {
        if (!bail) {
          pushErrorNotification(err);
        }
      }
    })();

    return () => {
      // must determine when the mint has changed or the component
      // has dismounted and not update state/send errors.
      bail = true;
    };
  }, [
    mint,
    psyRegistryToken,
    pushErrorNotification,
    token,
    tokenMintInfo,
    upsertSplTokenMintInfo,
  ]);

  return useMemo(() => {
    if (psyRegistryToken) {
      return {
        mintAuthority: null,
        supply: new BN(0),
        decimals: psyRegistryToken.decimals,
        isInitialized: true,
        freezeAuthority: null,
      };
    }

    return tokenMintInfo;
  }, [psyRegistryToken, tokenMintInfo]);
};
