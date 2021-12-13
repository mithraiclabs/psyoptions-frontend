import { activeNetwork, quoteMint } from '@/recoil';
import { serumUtils, OptionMarketWithKey } from '@mithraic-labs/psy-american';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { MarketMeta } from '@mithraic-labs/market-meta';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';
import { getSupportedMarketsByNetwork } from '../utils/networkInfo';

export const useDeriveMultipleSerumMarketAddresses = (
  options: OptionMarketWithKey[],
): PublicKey[] => {
  const network = useRecoilValue(activeNetwork);
  const [serumMarketKeys, setSerumMarketKeys] = useState<PublicKey[]>([]);
  const program = useAmericanPsyOptionsProgram();
  const _quoteMint = useRecoilValue(quoteMint);

  useEffect(() => {
    if (!program || !_quoteMint) {
      return;
    }
    const marketMetaOptions = getSupportedMarketsByNetwork(network.name);
    (async () => {
      const deriveSerumAddressesPromises = options.map(async (option) => {
        // Check if the option exists in the market meta package first. This is for backwards
        // compatibility and could eventually be removed when the market meta package is no
        // longer needed.
        const serumMarketAddress = marketMetaOptions.find(
          (optionMarketWithKey) =>
            optionMarketWithKey.optionMarketAddress === option.key.toString(),
        )?.serumMarketAddress;
        if (serumMarketAddress) {
          console.log('*** using package', serumMarketAddress);
          return new PublicKey(serumMarketAddress);
        }
        const [address, bump] = await serumUtils.deriveSerumMarketAddress(
          program,
          option.key,
          _quoteMint,
        );
        return address;
      });
      const derivedAddresses = await Promise.all(deriveSerumAddressesPromises);
      setSerumMarketKeys(derivedAddresses);
    })();
  }, [options, program, _quoteMint, network]);

  return serumMarketKeys;
};
