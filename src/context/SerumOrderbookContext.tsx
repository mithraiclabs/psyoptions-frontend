import React, { createContext, useContext, useState } from 'react'

import type { Orderbook } from '@mithraic-labs/serum'

export type Order = {
  price: number
  size: number
}
export type OrderbookData = {
  asks: Order[]
  bids: Order[]
  bidOrderbook: Orderbook
  askOrderbook: Orderbook
}

type SerumOrderbooks = Record<string, OrderbookData>

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
