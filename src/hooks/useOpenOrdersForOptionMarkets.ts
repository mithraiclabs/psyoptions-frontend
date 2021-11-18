import { getAllOptionAccounts, serumUtils } from '@mithraic-labs/psy-american';
import { useState, useEffect } from 'react';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';
import useConnection from './useConnection';
import { useConnectedWallet } from '@saberhq/use-solana';
import * as Sentry from '@sentry/react';
import { OpenOrders } from '@project-serum/serum';

/**
 * Get open orders for a user for option market keys
 *
 * @returns { openOrders: OpenOrders[]; loadingOpenOrders: boolean; }
 */
export const useOpenOrdersForOptionMarkets = (): {
  openOrders: OpenOrders[];
  loadingOpenOrders: boolean;
} => {
  const [openOrders, setOpenOrders] = useState<OpenOrders[]>([]);
  const [loadingOpenOrders, setLoadingOpenOrders] = useState(false);
  const program = useAmericanPsyOptionsProgram();
  const { dexProgramId } = useConnection();
  const wallet = useConnectedWallet();

  useEffect(() => {
    (async () => {
      if (!program || !dexProgramId || !wallet?.publicKey) return;
      setLoadingOpenOrders(true);

      try {
        const optionMarketWithKeys = await getAllOptionAccounts(program);
        const keys = optionMarketWithKeys.map((marketInfo) => marketInfo.key);

        const orders = await serumUtils.findOpenOrdersForOptionMarkets(
          program,
          dexProgramId,
          keys,
        );

        setOpenOrders(orders);
      } catch (err) {
        console.error(err);
        Sentry.captureException(err);
      } finally {
        setLoadingOpenOrders(false);
      }
    })();
  }, [program, dexProgramId, wallet?.publicKey]);

  return { openOrders, loadingOpenOrders };
};
