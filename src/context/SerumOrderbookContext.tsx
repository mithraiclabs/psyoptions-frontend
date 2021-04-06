import React, { createContext, useContext, useState } from 'react'

export type Order = {
  price: number
  size: number
}
export type Orderbook = {
  asks: Order[]
  bids: Order[]
}

type SerumOrderbooks = Record<string, Orderbook>

type SerumOrderbookContext = [
  SerumOrderbooks,
  React.Dispatch<React.SetStateAction<SerumOrderbooks>>,
]
const SerumOrderbookContext = createContext<SerumOrderbookContext>([
  {},
  () => {},
])

export const DEFAULT_DEPTH = 20

export const SerumOrderbooksProvider: React.FC = ({ children }) => {
  const orderbookState = useState<SerumOrderbooks>({})

  return (
    <SerumOrderbookContext.Provider value={orderbookState}>
      {children}
    </SerumOrderbookContext.Provider>
  )
}

export const useSerumOrderbooks = (): SerumOrderbookContext =>
  useContext(SerumOrderbookContext)
