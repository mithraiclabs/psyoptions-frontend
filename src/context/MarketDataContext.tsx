import React, { createContext, useContext } from 'react'
import { TrackerMarketData, useChainMarketData } from '../hooks/PsyOptionsAPI'
import { ChainRow } from '../hooks/useOptionsChain'

/**
 * Fetch and provide computed data from historical trades (i.e. data from psyoptions market tracker)
 */
const MarketDataContext = createContext<Record<string, TrackerMarketData>>({})

export const MarketDataProvider: React.FC<{ chain: ChainRow[] | undefined }> =
  ({ chain, children }) => {
    const data = {} // useChainMarketData(chain)

    return (
      <MarketDataContext.Provider value={data}>
        {children}
      </MarketDataContext.Provider>
    )
  }

export const useMarketData = (): Record<
  string,
  TrackerMarketData | undefined
> => useContext(MarketDataContext)
