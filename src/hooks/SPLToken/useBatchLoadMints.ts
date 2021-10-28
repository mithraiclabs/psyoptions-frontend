import { MintInfo, MintLayout, u64 } from '@solana/spl-token';
import { AccountInfo, PublicKey } from '@solana/web3.js';
import { useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { useSPLTokenMints } from '../../context/SPLTokenMintsContext';
import useConnection from '../useConnection';
import { chunkArray } from '@/utils/general';

/**
 * Fetch and update global context state with SPL Token mint info.
 *
 * @param mint
 * @returns
 */
export const useBatchLoadMints = (mints: PublicKey[]) => {
  const { connection } = useConnection();
  const [splTokenMints, setSPLTokenMints] = useSPLTokenMints();

  useEffect(() => {
    if (!mints.length) return;
    (async () => {
      try {
        const groupOfMints: PublicKey[][] = chunkArray(mints, 100);
        const getMultipleAccountsInfoPromises: Promise<AccountInfo<Buffer>[]>[] = [];
        groupOfMints.forEach(mints => {
          getMultipleAccountsInfoPromises.push(connection.getMultipleAccountsInfo(mints));
        });
        Promise.all(getMultipleAccountsInfoPromises).then(results => {
          const infos: AccountInfo<Buffer>[] = results.flat();
          const mintInfos: Record<string, MintInfo> = {};
          infos.forEach((info, index) => {
            if (!info)
              return;
            const mintInfo = MintLayout.decode(info.data);
            if (mintInfo.mintAuthorityOption === 0) {
              mintInfo.mintAuthority = null;
            } else {
              mintInfo.mintAuthority = new PublicKey(mintInfo.mintAuthority);
            }
  
            mintInfo.supply = u64.fromBuffer(mintInfo.supply);
            mintInfo.isInitialized = mintInfo.isInitialized !== 0;
  
            if (mintInfo.freezeAuthorityOption === 0) {
              mintInfo.freezeAuthority = null;
            } else {
              mintInfo.freezeAuthority = new PublicKey(mintInfo.freezeAuthority);
            }
            mintInfos[mints[index].toString()] = mintInfo;
          });
          setSPLTokenMints((_mintInfos) => ({
            ..._mintInfos,
            ...mintInfos,
          }));
        }).catch(err => {
          console.error(err);
          Sentry.captureException(err);
        });
      } catch (err) {
        console.error(err);
        Sentry.captureException(err);
      }
    })();
  }, [connection, mints, setSPLTokenMints]);

  return splTokenMints;
};
