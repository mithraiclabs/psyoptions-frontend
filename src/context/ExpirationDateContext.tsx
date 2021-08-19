import { MarketMeta } from '@mithraic-labs/market-meta'
import type { Moment } from 'moment'
import moment from 'moment'
import React, { createContext, useContext, useEffect, useState } from 'react'
import useLocalStorageState from 'use-local-storage-state'
import useAssetList from '../hooks/useAssetList'
import useConnection from '../hooks/useConnection'

type DateContextValue = {
  selectedDate: Moment | undefined
  dates: Moment[]
  setSelectedDate: (date: Moment) => void
}

const ExpirationDateContext = createContext<DateContextValue>({
  selectedDate: undefined,
  dates: [],
  setSelectedDate: () => {},
})

const ExpirationDateProvider: React.FC = ({ children }) => {
  const { endpoint } = useConnection()
  const { uAsset, qAsset, assetListLoading } = useAssetList()
  const [dates, setDates] = useState([])
  const [_selectedDatesByAsset, _setSelectedDatesByAsset] =
    useLocalStorageState('selectedDates', {})

  const _selectedDate = _selectedDatesByAsset[uAsset?.tokenSymbol]
  const parsedDate = moment.utc(_selectedDate)

  useEffect(() => {
    if (!assetListLoading && uAsset?.mintAddress && qAsset?.mintAddress) {
      const markets =
        MarketMeta[endpoint.name.toLowerCase()]?.optionMarkets || []

      const expirationsForAssetPair = [
        ...new Set(
          markets
            .filter(
              (market) =>
                market.underlyingAssetMint === uAsset?.mintAddress &&
                market.quoteAssetMint === qAsset?.mintAddress,
            )
            .map((market) => market.expiration),
        ),
      ] as number[]

      const newDates = expirationsForAssetPair
        .sort((a, b) => a - b)
        .map((timestamp) => moment.utc(timestamp * 1000))
        .filter((date) => {
          // TODO - do we want a way to show recently expired dates instead of just dropping them?
          return date.isAfter(moment.utc())
        })

      setDates(newDates)
    }
  }, [
    assetListLoading,
    endpoint.name,
    uAsset?.mintAddress,
    qAsset?.mintAddress,
  ])

  useEffect(() => {
    // Set default date or load user's stored date for current asset
    if (
      dates.length > 0 &&
      (parsedDate.isBefore(moment.utc()) ||
        !dates.some((d) => d.toISOString() === _selectedDate))
    ) {
      _setSelectedDatesByAsset((prevValue) => ({
        ...prevValue,
        [uAsset?.tokenSymbol]: dates[0].toISOString(),
      }))
    }
  }, [
    dates,
    parsedDate,
    _selectedDate,
    _setSelectedDatesByAsset,
    uAsset?.tokenSymbol,
  ])

  const value = {
    setDates,
    dates,
    selectedDate: parsedDate,
    setSelectedDate: (date: Moment) => {
      _setSelectedDatesByAsset((prevValue) => ({
        ...prevValue,
        [uAsset?.tokenSymbol]: date.toISOString(),
      }))
    },
  }

  return (
    <ExpirationDateContext.Provider value={value}>
      {children}
    </ExpirationDateContext.Provider>
  )
}

export { ExpirationDateContext, ExpirationDateProvider }
