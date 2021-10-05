import { getAllOptionAccounts, serumUtils } from '@mithraic-labs/psy-american';
import { OpenOrders } from '@mithraic-labs/serum';
import { useState, useEffect } from 'react';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';
import useConnection from './useConnection';

/**
 * Get open orders for a user for option market keys
 *
 * @returns OpenOrders[] | null
 */
export const useOpenOrdersForOptionMarkets = () => {
  const [openOrders, setOpenOrders] = useState([] as OpenOrders[] | null);
  const program = useAmericanPsyOptionsProgram();
  const { dexProgramId } = useConnection();

  useEffect(() => {
    (async () => {
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
  }, [program, dexProgramId]);

  return { openOrders };
};
