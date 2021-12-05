import { PublicKey } from '@solana/web3.js';
import { useEffect } from 'react';
import { SerumMarketAndProgramId } from '../../types';
import useConnection from '../useConnection';
import useSerum from '../useSerum';

/**
 * Load serum markets and store in state
 */
export const useLoadSerumDataByMarketAddresses = (marketKeys: PublicKey[]) => {
  const { dexProgramId } = useConnection();
  const { fetchMultipleSerumMarkets } = useSerum();

  useEffect(() => {
    if (!dexProgramId) {
      return;
    }
    // TODO refactor to fetch and store state in recoil
    const serumKeys: SerumMarketAndProgramId[] = marketKeys.map((key) => ({
      serumMarketKey: key,
      serumProgramId: dexProgramId.toString(),
    }));
    fetchMultipleSerumMarkets(serumKeys);
  }, [dexProgramId, fetchMultipleSerumMarkets, marketKeys]);
};
