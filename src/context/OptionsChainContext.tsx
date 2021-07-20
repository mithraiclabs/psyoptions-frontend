import React, { useState, createContext } from 'react'
import { ChainRow } from '../types'

const OptionsChainContext = createContext<{
  chains: ChainRow[]
  setChains: React.Dispatch<React.SetStateAction<ChainRow[]>>
}>({
  chains: [],
  setChains: () => null,
})

const OptionsChainProvider = ({ children }) => {
  const [chains, setChains] = useState<ChainRow[]>([])

  return (
    <OptionsChainContext.Provider value={{ chains, setChains }}>
      {children}
    </OptionsChainContext.Provider>
  )
}

export { OptionsChainContext, OptionsChainProvider }
