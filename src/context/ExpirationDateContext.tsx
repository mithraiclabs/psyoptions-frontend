import type { Moment } from 'moment';
import moment from 'moment';
import React, { createContext, useCallback, useEffect, useState } from 'react';
import useLocalStorageState from 'use-local-storage-state';
import useOptionsMarkets from '../hooks/useOptionsMarkets';
import useAssetList from '../hooks/useAssetList';

type DateContextValue = {
  setDates: React.Dispatch<React.SetStateAction<Moment[]>>;
  selectedDate: Moment | undefined;
  dates: Moment[];
  setSelectedDate: (date: Moment) => void;
};

const ExpirationDateContext = createContext<DateContextValue>({
  setDates: () => {},
  selectedDate: undefined,
  dates: [],
  setSelectedDate: () => {},
});

const ExpirationDateProvider: React.FC = ({ children }) => {
  const { uAsset, qAsset, assetListLoading } = useAssetList();
  const { marketsByUiKey } = useOptionsMarkets();
  const [dates, setDates] = useState<Moment[]>([]);
  const [_selectedDatesByAsset, _setSelectedDatesByAsset] =
    useLocalStorageState<Record<string, string>>('selectedDates', {});
  const [parsedDate, setParsedDate] = useState<Moment | null>(null);

  const setSelectedDate = useCallback((date: Moment) => {
    if (uAsset?.tokenSymbol) {
      _setSelectedDatesByAsset((prevValue) => ({
        ...prevValue,
        [uAsset.tokenSymbol]: date.toISOString(),
      }));

      setParsedDate(date);
    }
  }, [
    _setSelectedDatesByAsset,
    uAsset?.tokenSymbol
  ]);

  useEffect(() => {
    if (!assetListLoading && uAsset?.mintAddress && qAsset?.mintAddress) {
      const expirationsForAssetPair = Array.from(
        new Set(
          Object.keys(marketsByUiKey)
            .filter(
              (marketKey) =>
                marketsByUiKey[marketKey].underlyingAssetMintKey.toString() ===
                uAsset?.mintAddress &&
                marketsByUiKey[marketKey].quoteAssetMintKey.toString() ===
                qAsset?.mintAddress,
            )
            .map((marketKey) => marketsByUiKey[marketKey].expiration),
        ),
      );

      const newDates = expirationsForAssetPair
        .sort((a, b) => a - b)
        .map((timestamp) => moment.utc(timestamp * 1000))
        .filter((date) => {
          // TODO - do we want a way to show recently expired dates instead of just dropping them?
          return date.isAfter(moment.utc());
        });

      setDates(newDates);
      if (!parsedDate && newDates.length) {
        // Set default date or load user's stored date for current asset
        const _selectedDate = _selectedDatesByAsset[uAsset?.tokenSymbol ?? ''];
        if (_selectedDate && newDates.some((d) => d.toISOString() === _selectedDate)) {
          setParsedDate(moment.utc(_selectedDate));
        } else {
          setParsedDate(newDates[0]);
        }
      }
    }
  }, [
    assetListLoading,
    marketsByUiKey,
    uAsset?.mintAddress,
    uAsset?.tokenSymbol,
    qAsset?.mintAddress,
    _selectedDatesByAsset,
    parsedDate]);

  return (
    <ExpirationDateContext.Provider
      value={{
        setDates,
        dates,
        selectedDate: parsedDate,
        setSelectedDate,
      }}
    >
      {children}
    </ExpirationDateContext.Provider>
  );
};

export { ExpirationDateContext, ExpirationDateProvider };
