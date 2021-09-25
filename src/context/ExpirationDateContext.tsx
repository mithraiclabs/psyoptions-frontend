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
  const { markets } = useOptionsMarkets();
  const [dates, setDates] = useState<Moment[]>([]);
  const [_selectedDatesByAsset, _setSelectedDatesByAsset] =
    useLocalStorageState<Record<string, string>>('selectedDates', {});
  const setSelectedDate = useCallback(
    (date: Moment) => {
      if (uAsset?.tokenSymbol) {
        _setSelectedDatesByAsset((prevValue) => ({
          ...prevValue,
          [uAsset.tokenSymbol]: date.toISOString(),
        }));
      }
    },
    [_setSelectedDatesByAsset, uAsset?.tokenSymbol],
  );

  const _selectedDate = _selectedDatesByAsset[uAsset?.tokenSymbol ?? ''];
  const parsedDate = moment.utc(_selectedDate);

  useEffect(() => {
    if (!assetListLoading && uAsset?.mintAddress && qAsset?.mintAddress) {
      const expirationsForAssetPair = Array.from(
        new Set(
          Object.keys(markets)
            .filter(
              (marketKey) =>
                markets[marketKey].underlyingAssetMintKey.toString() ===
                  uAsset?.mintAddress &&
                markets[marketKey].quoteAssetMintKey.toString() ===
                  qAsset?.mintAddress,
            )
            .map((marketKey) => markets[marketKey].expiration),
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
    }
  }, [assetListLoading, markets, uAsset?.mintAddress, qAsset?.mintAddress]);

  useEffect(() => {
    // Set default date or load user's stored date for current asset
    if (
      uAsset?.tokenSymbol &&
      dates.length > 0 &&
      (parsedDate.isBefore(moment.utc()) ||
        !dates.some((d) => d.toISOString() === _selectedDate))
    ) {
      _setSelectedDatesByAsset((prevValue) => ({
        ...prevValue,
        [uAsset.tokenSymbol]: dates[0].toISOString(),
      }));
    }
  }, [
    dates,
    parsedDate,
    _selectedDate,
    _setSelectedDatesByAsset,
    uAsset?.tokenSymbol,
  ]);

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
