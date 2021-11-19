import { BigNumber } from 'bignumber.js';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import {
  quoteMint,
  selectOptionsByMarketsPageParams,
  underlyingAmountPerContract,
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
  const _underlyingAmountPerContract = useRecoilValue(
    underlyingAmountPerContract,
  );
  useLoadOptionsMintInfo(options);
  useLoadSerumDataByMarketAddresses(serumAddresses);

  return useMemo(() => {
    if (!_underlyingMint) {
      return [];
    }
    const chainObject = options.reduce((acc, option, index) => {
      const isCall = option.underlyingAssetMint.equals(_underlyingMint);
      const normalizedContractSize = normalizeUnderlyingAmountBN(
        _underlyingAmountPerContract,
      );
      let normalizedUnderlyingAmount = normalizeUnderlyingAmountBN(
        option.underlyingAmountPerContract,
      );
      let normalizedQuoteAmount = normalizeQuoteAmountBN(
        option.quoteAmountPerContract,
      );
      if (!isCall) {
        normalizedUnderlyingAmount = normalizeQuoteAmountBN(
          option.quoteAmountPerContract,
        );
        normalizedQuoteAmount = normalizeUnderlyingAmountBN(
          option.underlyingAmountPerContract,
        );
      }

      // Must square and divide by the normalized contract size
      // in order to get the appropriate strike price
      const strike = normalizedUnderlyingAmount
        .multipliedBy(normalizedQuoteAmount)
        .div(normalizedContractSize.pow(new BigNumber(2)));
      const key = `${option.expirationUnixTimestamp}-${strike.toNumber()}`;

      const callOrPutRow = {
        ...option,
        type: isCall ? OptionType.CALL : OptionType.PUT,
        strike,
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
    _underlyingAmountPerContract,
    _underlyingMint,
    normalizeQuoteAmountBN,
    normalizeUnderlyingAmountBN,
    options,
    serumAddresses,
  ]);
};
