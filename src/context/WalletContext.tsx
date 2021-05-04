import { PublicKey } from '@solana/web3.js'
import * as Sentry from '@sentry/react'
import React, { createContext, useEffect, useState } from 'react'
import useConnection from '../hooks/useConnection'
import useNotifications from '../hooks/useNotifications'

const WalletContext = createContext({})

Sentry.captureException(new Error('Test sentry source maps'))

const WalletProvider: React.FC = ({ children }) => {
  const { pushNotification } = useNotifications()
  const { connection } = useConnection()
  const [loading, setLoading] = useState(false)
  const [wallet, setWallet] = useState()
  const [connected, setConnected] = useState(false)
  const [pubKey, setPubKey] = useState<PublicKey | null>(null)
  // balance of public key in lamports
  const [balance, setBalance] = useState(0)

  // This is ok to have in the context because the logic
  // should remain the same no matter where the user is
  useEffect(() => {
    let subscription
    if (pubKey) {
      // fetch balance on mount
      ;(async () => {
        try {
          const _balance = await connection.getBalance(pubKey)
          setBalance(_balance)
        } catch (err) {
          Sentry.captureException(err)
          pushNotification({
            severity: 'error',
            message: `${err}`,
          })
        }
      })()
      // subscribe to wallet balance changes
      subscription = connection.onAccountChange(pubKey, (account) => {
        setBalance(account.lamports)
      })
    }

    return () => {
      if (subscription) {
        connection.removeAccountChangeListener(subscription)
      }
    }
  }, [connection, pubKey, pushNotification])

  // TODO: move all this into a useReducer() state, get rid of useState() here

  const state = {
    balance,
    loading,
    setLoading,
    wallet,
    setWallet,
    connected,
    setConnected,
    pubKey,
    setPubKey,
  }

  return (
    <WalletContext.Provider value={state}>{children}</WalletContext.Provider>
  )
}

export { WalletContext, WalletProvider }
