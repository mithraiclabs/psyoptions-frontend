/* eslint-disable @typescript-eslint/ban-ts-comment */
import { OpenOrders } from '@mithraic-labs/serum';
import { useEffect } from 'react';
import {
  PSY_AMERICAN_PROGRAM_IDS,
  ProgramVersions,
  serumUtils,
} from '@mithraic-labs/psy-american';

import { PublicKey } from '@solana/web3.js';
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext';
import useConnection from '../useConnection';
import useSerum from '../useSerum';
import useWallet from '../useWallet';
import { hasUnsettled } from '../../utils/hasUnsettled';
import { useOptionMarketByKey } from '../PsyOptionsAPI/useOptionMarketByKey';
import { useAmericanPsyOptionsProgram } from '../useAmericanPsyOptionsProgram';
/**
 * Fetch and return wallet's open orders for a given serum market
 */
export const useSerumOpenOrderAccounts = (
  serumMarketAddress: string,
  optionMarketUiKey: string | undefined,
  skipFetch = false,
): OpenOrders[] | undefined => {
  const program = useAmericanPsyOptionsProgram();
  const optionMarket = useOptionMarketByKey(optionMarketUiKey);
  const { connection } = useConnection();
  const { serumMarkets } = useSerum();
  const { pubKey } = useWallet();
  const [serumOpenOrders, setSerumOpenOrders] = useSerumOpenOrders();
  const serumMarket = serumMarkets[serumMarketAddress]?.serumMarket;

  useEffect(() => {
    if (serumMarket && !skipFetch && pubKey && optionMarket) {
      (async () => {
        let openOrders: OpenOrders[];
        if (
          PSY_AMERICAN_PROGRAM_IDS[
            optionMarket.psyOptionsProgramId.toString()
          ] === ProgramVersions.V1
        ) {
          openOrders = await serumMarket.findOpenOrdersAccountsForOwner(
            connection,
            pubKey,
          );
        } else {
          // @ts-ignore: different Serum-TS versions
          openOrders = await serumUtils.findOpenOrdersAccountsForOwner(
            program,
            new PublicKey(optionMarket.serumProgramId),
            new PublicKey(serumMarketAddress),
          );
        }
        const containsUnsettled = hasUnsettled(openOrders);
        setSerumOpenOrders((prevSerumOpenOrders) => ({
          ...prevSerumOpenOrders,
          [serumMarketAddress]: {
            error: null,
            loading: false,
            orders: openOrders,
            hasUnsettled: containsUnsettled,
          },
        }));
      })();
    }
  }, [
    connection,
    serumMarketAddress,
    pubKey,
    program,
    optionMarket,
    serumMarket,
    setSerumOpenOrders,
    skipFetch,
  ]);

  return serumOpenOrders[serumMarketAddress]?.orders;
};
