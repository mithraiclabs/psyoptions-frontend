import { serumUtils, OptionMarketWithKey } from '@mithraic-labs/psy-american';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';

export const useDeriveMultipleSerumMarketAddresses = (
  options: OptionMarketWithKey[],
): PublicKey[] => {
  const [serumMarketKeys, setSerumMarketKeys] = useState<PublicKey[]>([]);
  const program = useAmericanPsyOptionsProgram();

  useEffect(() => {
    if (!program) {
      return;
    }
    (async () => {
      const deriveSerumAddressesPromises = options.map((option) =>
        serumUtils.deriveSerumMarketAddress(program, option.key),
      );
      const derivedAddressesAndBumpSeeds = await Promise.all(
        deriveSerumAddressesPromises,
      );
      const derivedAddresses = derivedAddressesAndBumpSeeds.map(([key]) => key);
      setSerumMarketKeys(derivedAddresses);
    })();
  }, [options, program]);

  return serumMarketKeys;
};
