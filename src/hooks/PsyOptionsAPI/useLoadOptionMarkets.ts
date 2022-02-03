import { OptionMarket } from '@mithraic-labs/psy-american';
import { ProgramAccount } from '@project-serum/anchor';
import { useEffect, useRef } from 'react';
import { useInsertOptions } from '../../recoil';
import { useAmericanPsyOptionsProgram } from '../useAmericanPsyOptionsProgram';
import usePrevious from '../usePrevious';

/**
 * Load all options on chain and store in Recoil state
 */
export const useLoadOptionMarkets = (): void => {
  const program = useAmericanPsyOptionsProgram();
  const upsertOptions = useInsertOptions(true);
  const prevConnection = usePrevious(program?.provider.connection);
  const prevWallet = usePrevious(program?.provider.wallet.publicKey);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (
      hasInitialized.current &&
      program?.provider.connection &&
      program?.provider.connection === prevConnection &&
      program?.provider.wallet.publicKey === prevWallet
    ) {
      // Do not attempt to update options state when the effect runs,
      // but the connection (aka network) has not changed. This happens
      // when a user connects/disconnects their wallet
      return;
    }
    hasInitialized.current = true;
    (async () => {
      const options = (await program?.account.optionMarket.all()) as
        | ProgramAccount<OptionMarket>[]
        | null;

      if (options) {
        // update the option state
        upsertOptions(options);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, upsertOptions]);
};
