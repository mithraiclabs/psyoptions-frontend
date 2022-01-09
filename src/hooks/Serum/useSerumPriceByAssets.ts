import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { priceByAssets } from '../../recoil';
import { getPriceFromSerumOrderbook } from '../../utils/orderbook';
import { findMarketByAssets } from '../../utils/serum';
import useConnection from '../useConnection';
import useSerum from '../useSerum';
import { useSerumOrderbook } from './useSerumOrderbook';
import { useSubscribeSerumOrderbook } from './useSubscribeSerumOrderook';

/**
 * Look up price of a serum market based on the base asset and quote asset.
 * @param baseMint
 * @param quoteMint
 * @returns number
 */
export const useSerumPriceByAssets = (
  baseMint: PublicKey | string | null,
  quoteMint: PublicKey | string | null,
): number | null => {
  const { connection, dexProgramId } = useConnection();
  const { setSerumMarkets } = useSerum();
  const [serumMarketAddress, setSerumMarketAddress] =
    useState<PublicKey | null>(null);
  const baseMintStr =
    baseMint instanceof PublicKey ? baseMint.toString() : baseMint;
  const quoteMintStr =
    baseMint instanceof PublicKey ? baseMint.toString() : baseMint;
  const [price, setPrice] = useRecoilState(
    priceByAssets(`${baseMintStr}-${quoteMintStr}`),
  );
  const { orderbook: underlyingOrderbook } = useSerumOrderbook(
    serumMarketAddress?.toString() ?? '',
  );
  useSubscribeSerumOrderbook(serumMarketAddress?.toString() ?? '');

  useEffect(() => {
    if (!baseMint || !quoteMint || !dexProgramId) {
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
          serumProgramId: dexProgramId?.toString(),
        },
      }));
      setSerumMarketAddress(market.address);
    })();
  }, [baseMint, connection, dexProgramId, quoteMint, setSerumMarkets]);

  useEffect(() => {
    if (underlyingOrderbook) {
      const _price = getPriceFromSerumOrderbook(underlyingOrderbook);
      setPrice(_price ?? 0);
    }
  }, [setPrice, underlyingOrderbook]);

  return price;
};
