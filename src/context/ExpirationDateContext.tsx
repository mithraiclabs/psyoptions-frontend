import type { Moment } from 'moment'
import moment from 'moment'
import React, { createContext, useContext, useEffect } from 'react'
import useLocalStorageState from 'use-local-storage-state'

import { getLastFridayOfMonths } from '../utils/dates'

type DateContextValue = {
  dates: Moment[]
  selectedDate: Moment | undefined
  setSelectedDate: (date: Moment) => void
}

const dates = getLastFridayOfMonths(10)

const ExpirationDateContext = createContext<DateContextValue>({
  selectedDate: undefined,
  dates,
  setSelectedDate: () => {},
})

const defaultDate = dates[0].toISOString()

const ExpirationDateProvider: React.FC = ({ children }) => {
  const [_selectedDate, _setSelectedDate] = useLocalStorageState(
    'selectedDate',
    defaultDate,
  )

  const parsedDate = moment.utc(_selectedDate)

  useEffect(() => {
    if (parsedDate.isBefore(moment.utc())) {
      _setSelectedDate(dates[0].toISOString())
    }
  }, [parsedDate, _setSelectedDate])

  const value = {
    dates,
    selectedDate: parsedDate,
    setSelectedDate: (date: Moment) => {
      _setSelectedDate(date.toISOString())
    },
  }

  return (
    <ExpirationDateContext.Provider value={value}>
      {children}
    </ExpirationDateContext.Provider>
  )
}

export { ExpirationDateContext, ExpirationDateProvider }
