import { getAllOptionAccounts, serumUtils } from '@mithraic-labs/psy-american';
import { OpenOrders } from '@mithraic-labs/serum';
import { useState, useEffect } from 'react';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';
import useConnection from './useConnection';
import { useConnectedWallet } from '@saberhq/use-solana';
import * as Sentry from '@sentry/react';
import { useRecoilValue } from 'recoil';
import { quoteMint } from '../recoil';

/**
 * Get open orders for a user for option market keys
 *
 * @returns { openOrders: OpenOrders[]; loadingOpenOrders: boolean; }
 */
export const useOpenOrdersForOptionMarkets = (): {
  openOrders: OpenOrders[];
  loadingOpenOrders: boolean;
} => {
  const [openOrders, setOpenOrders] = useState([] as OpenOrders[]);
  const [loadingOpenOrders, setLoadingOpenOrders] = useState(false);
  const program = useAmericanPsyOptionsProgram();
  const { dexProgramId } = useConnection();
  const wallet = useConnectedWallet();
  const _quoteMint = useRecoilValue(quoteMint);

  useEffect(() => {
    (async () => {
      if (!program || !dexProgramId || !wallet?.publicKey || !_quoteMint) {
        return;
      }
      setLoadingOpenOrders(true);

      try {
        const optionMarketWithKeys = await getAllOptionAccounts(program);
        const keys = optionMarketWithKeys.map((marketInfo) => marketInfo.key);

        const orders = await serumUtils.findOpenOrdersForOptionMarkets(
          program,
          dexProgramId,
          keys,
          _quoteMint,
        );

        // #TODO: remove as any
        setOpenOrders(orders as any);
      } catch (err) {
        console.error(err);
        Sentry.captureException(err);
      } finally {
        setLoadingOpenOrders(false);
      }
    })();
  }, [program, dexProgramId, wallet?.publicKey, _quoteMint]);

  return { openOrders, loadingOpenOrders };
};
