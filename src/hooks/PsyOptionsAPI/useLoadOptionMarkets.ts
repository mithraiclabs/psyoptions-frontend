import { OptionMarket } from '@mithraic-labs/psy-american';
import { ProgramAccount } from '@project-serum/anchor';
import { useEffect } from 'react';
import { useUpsertOptions } from '../../recoil';
import { useAmericanPsyOptionsProgram } from '../useAmericanPsyOptionsProgram';

/**
 * Load all options on chain and store in Recoil state
 */
export const useLoadOptionMarkets = (): void => {
  const program = useAmericanPsyOptionsProgram();
  const upsertOptions = useUpsertOptions(true);

  useEffect(() => {
    (async () => {
      const options = (await program?.account.optionMarket.all()) as
        | ProgramAccount<OptionMarket>[]
        | null;
      if (options) {
        // update the option state
        upsertOptions(options);
      }
    })();
  }, [program, upsertOptions]);
};
