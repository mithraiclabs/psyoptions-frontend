import { PsyAmericanIdl } from '@mithraic-labs/psy-american';
import { Program } from '@project-serum/anchor';
import { useMemo } from 'react';
import useConnection from './useConnection';
import { useProvider } from './useProvider';

/**
 * Get a program instance for the American PsyOptions protocol.
 *
 * @returns Program | null
 */
export const useAmericanPsyOptionsProgram = (): Program | null => {
  const { endpoint } = useConnection();
  const provider = useProvider();

  return useMemo(() => {
    if (endpoint.programId && provider) {
      return new Program(PsyAmericanIdl, endpoint.programId, provider);
    }
    return null;
  }, [endpoint.programId, provider]);
};
