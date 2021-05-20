import React, { useState, createContext, useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import { AccountLayout } from '@solana/spl-token'
import useConnection from '../hooks/useConnection'
import useNotifications from '../hooks/useNotifications'

const SolanaMetaContext = createContext()
export const useSolanaMeta = () => useContext(SolanaMetaContext)

export const SolanaMetaProvider = ({ children }) => {
  const { pushNotification } = useNotifications()
  const { connection } = useConnection()
  const [splTokenAccountRentBalance, setSplTokenAccountRentBalance] = useState(
    0,
  )

  useEffect(() => {
    ;(async () => {
      try {
        const rentBalance = await connection.getMinimumBalanceForRentExemption(
          AccountLayout.span,
        )
        setSplTokenAccountRentBalance(rentBalance)
      } catch (err) {
        console.error(err)
        pushNotification({
          severity: 'error',
          message: `${err}`,
        })
      }
    })()
  }, [connection, pushNotification])

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
