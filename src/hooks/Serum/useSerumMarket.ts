import { PublicKey } from '@solana/web3.js';
import { useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { findMarketByAssets } from '../../utils/serum';
import useConnection from '../useConnection';
import { LocalSerumMarket } from '../../types';
import { useSerumContext } from '../../context/SerumContext';
import useNotifications from '../useNotifications';

/**
 * Fetch and return a serum market
 */
export const useSerumMarket = (
  /* The string represenation of the Serum Market's PublicKey */
  key: PublicKey,
  /* The string represenation of the Serum Market's base asset's PublicKey */
  mintA: PublicKey,
  /* The string represenation of the Serum Market's quote asset's PublicKey */
  mintB: PublicKey,
): LocalSerumMarket | undefined => {
  const { pushNotification } = useNotifications();
  const { connection, dexProgramId } = useConnection();
  const { serumMarkets, setSerumMarkets } = useSerumContext();
  const serumAddress = key.toString();
  const serumMarket = serumMarkets[serumAddress];

  useEffect(() => {
    if (serumMarket || !dexProgramId) {
      // Short circuit since the market is already loaded into state.
      // This data should not change, so no need to refetch
      return;
    }

    setSerumMarkets((markets) => ({
      ...markets,
      [serumAddress]: { loading: true },
    }));
    (async () => {
      try {
        const market = await findMarketByAssets(
          connection,
          mintA,
          mintB,
          dexProgramId,
        );
        // @ts-ignore need to update this type at some point
        setSerumMarkets((markets) => ({
          ...markets,
          [serumAddress]: {
            loading: false,
            serumMarket: market,
          },
        }));
      } catch (err) {
        setSerumMarkets((markets) => ({
          ...markets,
          [serumAddress]: {
            loading: false,
            error: err,
          },
        }));
        Sentry.captureException(err);
        pushNotification({
          severity: 'error',
          message: `${err}`,
        });
      }
    })();
  }, [
    connection,
    dexProgramId,
    key,
    mintA,
    mintB,
    pushNotification,
    serumAddress,
    serumMarket,
    setSerumMarkets,
  ]);

  return serumMarket;
};
