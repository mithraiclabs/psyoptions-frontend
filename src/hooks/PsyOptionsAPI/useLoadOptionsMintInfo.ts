import { OptionMarketWithKey } from '@mithraic-labs/psy-american';
import { useMemo } from 'react';
import { useBatchLoadMints } from '../SPLToken';

export const useLoadOptionsMintInfo = (options: OptionMarketWithKey[]) => {
  const optionMints = useMemo(
    () => options.map((option) => option.optionMint),
    [options],
  );
  useBatchLoadMints(optionMints);
};
