import { serumUtils } from '@mithraic-labs/psy-american';
import { useEffect } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import { useConnectedWallet } from '@saberhq/use-solana';
import {
  activeNetwork,
  quoteMint,
  useAddUniqueOpenOrdersByOptionKey,
  selectAllOptions,
  atomLoader,
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

  const wallet = useConnectedWallet();
  const [, setLoader] = useRecoilState(atomLoader);

  useEffect(() => {
    // TODO should clear the state when the program changes because the wallet changes
    if (!_quoteMint || !program || !dexProgramId) {
      return;
    }

    const supportedMarkets = getSupportedMarketsByNetwork(endpoint.name);
    (async () => {
      setLoader(true);
      const ordersByOption = await serumUtils.findOpenOrdersForOptionMarkets(
        program,
        dexProgramId,
        options.map((o) => o.key),
        _quoteMint,
        supportedMarkets,
      );
      // @ts-ignore
      insertOpenOrdersByOptionKey(ordersByOption);
      setLoader(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    _quoteMint,
    dexProgramId,
    endpoint.name,
    insertOpenOrdersByOptionKey,
    options,
    program,
    wallet?.publicKey,
  ]);
};
