import React, { createContext } from 'react'
import useOwnedTokenAccounts from '../hooks/useOwnedTokenAccounts'

const OwnedTokenAccountsContext = createContext({})

const OwnedTokenAccountsProvider = ({ children }) => {
  const ownedTokenAccounts = useOwnedTokenAccounts()

  return (
    <OwnedTokenAccountsContext.Provider value={ownedTokenAccounts}>
      {children}
    </OwnedTokenAccountsContext.Provider>
  )
}

export { OwnedTokenAccountsContext, OwnedTokenAccountsProvider }
