import { OptionMarketWithKey } from '@mithraic-labs/psy-american';
import { selector } from 'recoil';
import { optionsIds, optionsMap } from '.';

export const selectAllOptions = selector<OptionMarketWithKey[]>({
  key: 'selectAllOptions',
  get: ({ get }) =>
    get(optionsIds)
      .map((optionKey) => get(optionsMap(optionKey)))
      .filter((o) => !!o) as OptionMarketWithKey[],
});
