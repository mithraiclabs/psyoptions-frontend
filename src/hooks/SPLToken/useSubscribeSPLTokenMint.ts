import { MintLayout, u64 } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { useEffect } from 'react';
import { useSPLTokenMints } from '../../context/SPLTokenMintsContext';
import useConnection from '../useConnection';

/**
 * Manage subscription to an SPL Token Mint
 * @param mint
 */
export const useSubscribeSPLTokenMint = (mint: PublicKey | undefined): void => {
  const { connection } = useConnection();
  const [, setSPLTokenMints] = useSPLTokenMints();

  useEffect(() => {
    let subscription;
    if (mint) {
      subscription = connection.onAccountChange(mint, (mintAccount) => {
        const mintInfo = MintLayout.decode(mintAccount.data);
        // conform to the getMintInfo function from @solana/spl-token
        mintInfo.supply = u64.fromBuffer(mintInfo.supply);
        mintInfo.isInitialized = mintInfo.isInitialized !== 0;
        if (mintInfo.mintAuthorityOption === 0) {
          mintInfo.mintAuthority = null;
        } else {
          mintInfo.mintAuthority = new PublicKey(mintInfo.mintAuthority);
        }
        if (mintInfo.freezeAuthorityOption === 0) {
          mintInfo.freezeAuthority = null;
        } else {
          mintInfo.freezeAuthority = new PublicKey(mintInfo.freezeAuthority);
        }

        setSPLTokenMints((mints) => ({
          ...mints,
          [mint.toString()]: mintInfo,
        }));
      });
    }

    return () => {
      if (subscription) {
        connection.removeAccountChangeListener(subscription);
      }
    };
  }, [connection, mint, setSPLTokenMints]);
};
