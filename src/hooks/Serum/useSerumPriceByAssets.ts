import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { getPriceFromSerumOrderbook } from '../../utils/orderbook';
import { findMarketByAssets } from '../../utils/serum';
import useConnection from '../useConnection';
import useSerum from '../useSerum';
import { useSerumOrderbook } from './useSerumOrderbook';
import { useSubscribeSerumOrderbook } from './useSubscribeSerumOrderook';

export const useSerumPriceByAssets = (
  baseMint: PublicKey | string | null,
  quoteMint: PublicKey | string | null,
): number => {
  const { connection, dexProgramId } = useConnection();
  const { setSerumMarkets } = useSerum();
  const [serumMarketAddress, setSerumMarketAddress] =
    useState<PublicKey | null>(null);
  const { orderbook: underlyingOrderbook } = useSerumOrderbook(
    serumMarketAddress?.toString(),
  );
  useSubscribeSerumOrderbook(serumMarketAddress?.toString());

  useEffect(() => {
    if (!baseMint || !quoteMint) {
      return;
    }
    (async () => {
      const baseMintKey =
        typeof baseMint === 'string' ? new PublicKey(baseMint) : baseMint;
      const quoteMintKey =
        typeof quoteMint === 'string' ? new PublicKey(quoteMint) : quoteMint;
      const market = await findMarketByAssets(
        connection,
        baseMintKey,
        quoteMintKey,
        dexProgramId,
      );
      if (!market) {
        return;
      }
      setSerumMarkets((_markets) => ({
        ..._markets,
        [market.address.toString()]: {
          serumMarket: market,
          serumProgramId: dexProgramId.toString(),
        },
      }));
      setSerumMarketAddress(market.address);
    })();
  }, [baseMint, connection, dexProgramId, quoteMint, setSerumMarkets]);

  return getPriceFromSerumOrderbook(underlyingOrderbook);
};
