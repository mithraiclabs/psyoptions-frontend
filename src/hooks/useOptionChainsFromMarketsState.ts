import { BigNumber } from 'bignumber.js';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import {
  quoteMint,
  selectOptionsByMarketsPageParams,
  underlyingMint,
} from '../recoil';
import { CallOrPut, OptionType } from '../types';
import { useLoadOptionsMintInfo } from './PsyOptionsAPI/useLoadOptionsMintInfo';
import { useLoadSerumDataByMarketAddresses } from './Serum/useLoadSerumDataByMarketKeys';
import { useDeriveMultipleSerumMarketAddresses } from './useDeriveMultipleSerumMarketAddresses';
import { useNormalizeAmountOfMintBN } from './useNormalizeAmountOfMintBN';

type ChainRow = {
  key: string;
  strike: BigNumber;
  call: CallOrPut;
  put: CallOrPut;
};

/**
 *
 */
export const useOptionsChainFromMarketsState = (): ChainRow[] => {
  const options = useRecoilValue(selectOptionsByMarketsPageParams);
  const serumAddresses = useDeriveMultipleSerumMarketAddresses(options);
  const _underlyingMint = useRecoilValue(underlyingMint);
  const _quoteMint = useRecoilValue(quoteMint);
  const normalizeUnderlyingAmountBN =
    useNormalizeAmountOfMintBN(_underlyingMint);
  const normalizeQuoteAmountBN = useNormalizeAmountOfMintBN(_quoteMint);
  useLoadOptionsMintInfo(options);
  useLoadSerumDataByMarketAddresses(serumAddresses);

  return useMemo(() => {
    if (!_underlyingMint) {
      return [];
    }
    const chainObject = options.reduce((acc, option, index) => {
      const isCall = option.underlyingAssetMint.equals(_underlyingMint);
      // let normalizedUnderlying = option.underlyingAssetMint;
      // let normalizedQuote = option.quoteAssetMint;
      let normalizedUnderlyingAmount = normalizeUnderlyingAmountBN(
        option.underlyingAmountPerContract,
      );
      let normalizedQuoteAmount = normalizeQuoteAmountBN(
        option.quoteAmountPerContract,
      );
      if (!isCall) {
        // normalizedUnderlying = option.quoteAssetMint;
        // normalizedQuote = option.underlyingAssetMint;
        normalizedUnderlyingAmount = normalizeQuoteAmountBN(
          option.quoteAmountPerContract,
        );
        normalizedQuoteAmount = normalizeUnderlyingAmountBN(
          option.underlyingAmountPerContract,
        );
      }

      const strike = normalizedUnderlyingAmount.multipliedBy(
        normalizedQuoteAmount,
      );
      const key = `${option.expirationUnixTimestamp}-${strike.toNumber()}`;

      const callOrPutRow = {
        ...option,
        type: isCall ? OptionType.CALL : OptionType.PUT,
        strike,
        change: '', // TODO
        volume: '', // TODO
        openInterest: '', // TODO
        serumMarketKey: serumAddresses[index],
        initialized: true,
      };

      acc[key] = {
        ...(acc[key] ?? {}),
        key,
        strike,
        ...(isCall ? { call: callOrPutRow } : { put: callOrPutRow }),
      } as unknown as ChainRow;

      return acc;
    }, {} as Record<string, ChainRow>);

    return Object.values(chainObject).sort((rowA, rowB) =>
      rowA.strike.minus(rowB.strike).toNumber(),
    );
  }, [
    _underlyingMint,
    normalizeQuoteAmountBN,
    normalizeUnderlyingAmountBN,
    options,
    serumAddresses,
  ]);
};
