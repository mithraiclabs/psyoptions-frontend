import { serumUtils } from '@mithraic-labs/psy-american';
import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import {
  activeNetwork,
  quoteMint,
  useAddUniqueOpenOrdersByOptionKey,
  selectAllOptions,
} from '../recoil';
import { getSupportedMarketsByNetwork } from '../utils/networkInfo';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';
import useConnection from './useConnection';

/**
 * Hook to load OpenOrders for all options stored in recoil.
 */
export const useLoadOptionOpenOrders = () => {
  const program = useAmericanPsyOptionsProgram();
  const { dexProgramId } = useConnection();
  const insertOpenOrdersByOptionKey = useAddUniqueOpenOrdersByOptionKey();
  const options = useRecoilValue(selectAllOptions);
  // We may need to fix this to USDC for the time being.
  // Otherwise it could cause some UX trouble.
  const _quoteMint = useRecoilValue(quoteMint);
  const endpoint = useRecoilValue(activeNetwork);

  useEffect(() => {
    // TODO should clear the state when the program changes because the wallet changes
    if (!_quoteMint || !program || !dexProgramId) {
      return;
    }
    const supportedMarkets = getSupportedMarketsByNetwork(endpoint.name);
    (async () => {
      const ordersByOption = await serumUtils.findOpenOrdersForOptionMarkets(
        program,
        dexProgramId,
        options.map((o) => o.key),
        _quoteMint,
        supportedMarkets,
      );
      insertOpenOrdersByOptionKey(ordersByOption);
    })();
  }, [
    _quoteMint,
    dexProgramId,
    endpoint.name,
    insertOpenOrdersByOptionKey,
    options,
    program,
  ]);
};
