import { MintInfo } from '@solana/spl-token'
import React, { createContext, useContext, useState } from 'react'

type SPLTokenMints = Record<string, MintInfo>
type SPLTokenMintsContext = [
  SPLTokenMints,
  React.Dispatch<React.SetStateAction<SPLTokenMints>>,
]

const SPLTokenMintsContext = createContext<SPLTokenMintsContext>([{}, () => {}])

export const SPLTokenMintsProvider: React.FC = ({ children }) => {
  const optionMintsState = useState<SPLTokenMints>({})

  return (
    <SPLTokenMintsContext.Provider value={optionMintsState}>
      {children}
    </SPLTokenMintsContext.Provider>
  )
}

export const useSPLTokenMints = (): SPLTokenMintsContext =>
  useContext(SPLTokenMintsContext)
