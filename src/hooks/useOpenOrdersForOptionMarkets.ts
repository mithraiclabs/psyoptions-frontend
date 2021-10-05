import { getAllOptionAccounts, serumUtils } from '@mithraic-labs/psy-american';
import { OpenOrders } from '@mithraic-labs/serum';
import { useState, useEffect } from 'react';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';
import useConnection from './useConnection';
import useWallet from './useWallet';

/**
 * Get open orders for a user for option market keys
 *
 * @returns OpenOrders[]
 */
export const useOpenOrdersForOptionMarkets = () => {
  const [openOrders, setOpenOrders] = useState([] as OpenOrders[]);
  const program = useAmericanPsyOptionsProgram();
  const { dexProgramId } = useConnection();
  const { pubKey } = useWallet();

  useEffect(() => {
    (async () => {
      if (!program || !dexProgramId || !pubKey) return;
      const optionMarketWithKeys = await getAllOptionAccounts(program);
      const keys = optionMarketWithKeys.map(marketInfo => marketInfo.key);

      const orders = await serumUtils.findOpenOrdersForOptionMarkets(
        program,
        dexProgramId,
        keys,
      );

      // #TODO: remove as any
      setOpenOrders(orders as any);
    })();
  }, [program, dexProgramId, pubKey]);

  return { openOrders };
};
