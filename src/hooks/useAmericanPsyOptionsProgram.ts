import { PsyAmerican, PsyAmericanIdl } from '@mithraic-labs/psy-american';
import { Program } from '@project-serum/anchor';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { activeNetwork } from '../recoil';
import { useProvider } from './useProvider';

/**
 * Get a program instance for the American PsyOptions protocol.
 *
 * @returns Program | null
 */
export const useAmericanPsyOptionsProgram = (): Program<PsyAmerican> | null => {
  const endpoint = useRecoilValue(activeNetwork);
  const provider = useProvider();

  return useMemo(() => {
    if (endpoint?.programId && provider) {
      return new Program(
        PsyAmericanIdl,
        endpoint.programId,
        provider,
      ) as Program<PsyAmerican>;
    }
    return null;
  }, [endpoint?.programId, provider]);
};
