import { useContext, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';

import { Market } from '@mithraic-labs/serum';
import { SerumContext, SerumContextType } from '../context/SerumContext';
import {
  batchSerumMarkets,
  findMarketByAssets,
  getKeyForMarket,
} from '../utils/serum';
import useConnection from './useConnection';
import useNotifications from './useNotifications';
import {
  SerumOrderbooks,
  useSerumOrderbooks,
} from '../context/SerumOrderbookContext';
import { LocalSerumMarket, SerumMarketAndProgramId } from '../types';

interface SerumHook extends SerumContextType {
  fetchMultipleSerumMarkets: (
    serumMarketKeys: SerumMarketAndProgramId[],
  ) => Promise<void>;
  fetchSerumMarket: (
    serumMarketKey: PublicKey | undefined,
    baseMintKey: PublicKey,
    quoteMintKey: PublicKey,
    serumProgramKey?: PublicKey | undefined,
  ) => Promise<LocalSerumMarket | undefined>;
}

const useSerum = (): SerumHook => {
  const { pushNotification } = useNotifications();
  const { connection, dexProgramId } = useConnection();
  const { serumMarkets, setSerumMarkets } = useContext(SerumContext);
  const [, setOrderbooks] = useSerumOrderbooks();

  const fetchMultipleSerumMarkets = useCallback(
    async (serumMarketKeys: SerumMarketAndProgramId[]) => {
      if (!connection) {
        return;
      }
      try {
        // set that the serum markets are loading
        const loading: Record<string, LocalSerumMarket> = {};
        serumMarketKeys.forEach(({ serumMarketKey }) => {
          loading[serumMarketKey.toString()] = { loading: true };
        });
        setSerumMarkets((_markets) => ({ ..._markets, ...loading }));
        // batch load the serum Market data
        const { serumMarketsInfo } = await batchSerumMarkets(
          connection,
          serumMarketKeys,
          {},
        );
        const newMarkets: Record<string, LocalSerumMarket> = {};
        const newOrderbooks: SerumOrderbooks = {};
        serumMarketsInfo.forEach(
          ({ market, orderbookData, serumProgramId }) => {
            const key = getKeyForMarket(market);
            newMarkets[key] = {
              loading: false,
              serumMarket: market,
              serumProgramId,
            };
            newOrderbooks[getKeyForMarket(market)] = orderbookData;
          },
        );
        setSerumMarkets((_markets) => ({ ..._markets, ...newMarkets }));
        setOrderbooks((_orderbooks) => ({ ..._orderbooks, ...newOrderbooks }));
      } catch (error) {
        console.error(error);
      }
    },
    [connection, setOrderbooks, setSerumMarkets],
  );

  /**
   * Loads a serum market into the serumMarkets state
   * Or returns the instance if one already exists for the given mints
   *
   * @param serumMarketKey - Key for the Serum market
   * @param {string} mintA - Mint address of serum underlying asset
   * @param {string} mintB - Mint address of serum quote asset
   */
  const fetchSerumMarket = useCallback(
    async (
      serumMarketKey: PublicKey | undefined,
      baseMintKey: PublicKey,
      quoteMintKey: PublicKey,
      serumProgramKey?: PublicKey,
    ) => {
      // Set individual loading states for each market
      const programKey = serumProgramKey || dexProgramId;
      if (!serumMarketKey || !connection || !programKey) {
        return;
      }
      setSerumMarkets((markets) => ({
        ...markets,
        [serumMarketKey.toString()]: { loading: true },
      }));

      let serumMarket: Market | null = null;
      let error;
      try {
        if (serumMarketKey) {
          serumMarket = await Market.load(
            connection,
            serumMarketKey,
            {},
            programKey,
          );
        } else {
          serumMarket = await findMarketByAssets(
            connection,
            baseMintKey,
            quoteMintKey,
            programKey,
          );
        }
      } catch (err) {
        console.error(err);
        error = (err as Error).message;
        pushNotification({
          severity: 'error',
          message: `${err}`,
        });
      }

      const newMarket: LocalSerumMarket = {
        loading: false,
        error,
        serumMarket: serumMarket ?? undefined,
      };

      setSerumMarkets((markets) =>
        serumMarket
          ? { ...markets, [serumMarket.address.toString()]: newMarket }
          : markets,
      );

      return newMarket;
    },
    [setSerumMarkets, connection, dexProgramId, pushNotification],
  );

  return {
    serumMarkets,
    setSerumMarkets,
    fetchSerumMarket,
    fetchMultipleSerumMarkets,
  };
};

export default useSerum;
