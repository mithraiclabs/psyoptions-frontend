import React, { useState, createContext, useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import { AccountLayout } from '@solana/spl-token';
import useConnection from '../hooks/useConnection';

const SolanaMetaContext = createContext()
export const useSolanaMeta = () => useContext(SolanaMetaContext)

export const SolanaMetaProvider = ({ children }) => {
  const { connection } = useConnection()
  const [splTokenAccountRentBalance, setSplTokenAccountRentBalance] = useState(0)

  useEffect(() => {
    (async () => {
      const rentBalance = await connection.getMinimumBalanceForRentExemption(
        AccountLayout.span
      )
      setSplTokenAccountRentBalance(rentBalance)
    })()
  }, [connection])

  return (
    <SolanaMetaContext.Provider
      value={{
        splTokenAccountRentBalance,
      }}
    >
      {children}
    </SolanaMetaContext.Provider>
  )
}

SolanaMetaProvider.propTypes = {
  children: PropTypes.node,
}

SolanaMetaProvider.defaultProps = {
  children: null,
}