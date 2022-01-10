import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useSerumOrderbooks } from '../../context/SerumOrderbookContext';
import { useFormState } from '../../context/SimpleUIContext';
import { useLoadSerumDataByMarketAddresses } from '../Serum/useLoadSerumDataByMarketKeys';
import useAssetList from '../useAssetList';
import { useDeriveMultipleSerumMarketAddresses } from '../useDeriveMultipleSerumMarketAddresses';
import { useNormalizeAmountOfMintBN } from '../useNormalizeAmountOfMintBN';
import { useOptionsForExpiration } from './useOptionsForExpiration';

/**
 * Show all the strike prices that have an ask (i.e. available for sale).
 * Sorted by ask price instead of strike price.
 */
export const useStrikePricesBasedOnBreakeven = () => {
  const { contractSize, direction, underlyingAssetMint } = useFormState();
  const options = useOptionsForExpiration();
  const { USDCPublicKey } = useAssetList();
  const serumAddresses = useDeriveMultipleSerumMarketAddresses(options);
  const [orderbooks] = useSerumOrderbooks();
  const normalizeUnderlyingAmountBN =
    useNormalizeAmountOfMintBN(underlyingAssetMint);
  const normalizeQuoteAmountBN = useNormalizeAmountOfMintBN(USDCPublicKey);
  useLoadSerumDataByMarketAddresses(serumAddresses);

  return useMemo(() => {
    if (!serumAddresses.length) {
      return [];
    }
    return options
      .map((option, index) => {
        const normalizedContractSize = new BigNumber(contractSize);
        const normalizedUnderlyingAmount = normalizeUnderlyingAmountBN(
          direction === 'up'
            ? option.underlyingAmountPerContract
            : option.quoteAmountPerContract,
        );
        const normalizedQuoteAmount = normalizeQuoteAmountBN(
          direction === 'up'
            ? option.quoteAmountPerContract
            : option.underlyingAmountPerContract,
        );
        const strike = normalizedUnderlyingAmount
          .multipliedBy(normalizedQuoteAmount)
          .div(normalizedContractSize.pow(new BigNumber(2)));
        const serumMarketAddress = serumAddresses[index];
        const orderbook = orderbooks[serumMarketAddress?.toString()];

        const ask = orderbook?.asks[0]?.price ?? 0;
        const bid = orderbook?.bids[0]?.price ?? 0;

        return {
          option,
          ask,
          bid,
          serumMarketAddress,
          strike,
        };
      })
      .filter(({ ask, bid }) => !!ask && !!bid)
      .sort((a, b) => b.ask - a.ask);
  }, [
    contractSize,
    direction,
    normalizeQuoteAmountBN,
    normalizeUnderlyingAmountBN,
    options,
    orderbooks,
    serumAddresses,
  ]);
};
