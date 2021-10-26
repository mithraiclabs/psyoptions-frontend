import { getAllOptionAccounts, serumUtils } from '@mithraic-labs/psy-american';
import { OpenOrders } from '@project-serum/serum';
import { useState, useEffect } from 'react';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';
import useConnection from './useConnection';
import { useConnectedWallet } from '@saberhq/use-solana';

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

  useEffect(() => {
    (async () => {
      if (!program || !dexProgramId || !wallet?.publicKey) return;
      setLoadingOpenOrders(true);
      const optionMarketWithKeys = await getAllOptionAccounts(program);
      const keys = optionMarketWithKeys.map((marketInfo) => marketInfo.key);

      const orders = await serumUtils.findOpenOrdersForOptionMarkets(
        program,
        dexProgramId,
        keys,
      );

      setLoadingOpenOrders(false);

      // #TODO: remove as any
      setOpenOrders(orders as any);
    })();
  }, [program, dexProgramId, wallet?.publicKey]);

  return { openOrders, loadingOpenOrders };
};
