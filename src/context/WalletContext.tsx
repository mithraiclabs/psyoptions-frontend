import { PublicKey } from '@solana/web3.js'
import * as Sentry from '@sentry/react'
import React, { createContext, useEffect, useState } from 'react'
import useConnection from '../hooks/useConnection'
import useNotifications from '../hooks/useNotifications'
import { isBrowser } from '../utils/isNode'
import getPhantomAdapter from '../utils/wallet/adapters/phantom'

import type WalletAdapter from '../utils/wallet/walletAdapter'

const WalletContext = createContext({})

const WalletProvider: React.FC = ({ children }) => {
  const { pushNotification } = useNotifications()
  const { connection } = useConnection()
  const [loading, setLoading] = useState(false)
  const [wallet, setWallet] = useState<WalletAdapter | undefined>()
  const [connected, setConnected] = useState(false)
  const [pubKey, setPubKey] = useState<PublicKey | null>(null)
  // balance of public key in lamports
  const [balance, setBalance] = useState(0)

  // Eager connect to phantom on initial load if user has allowed it
  useEffect(() => {
    if (isBrowser && window?.solana?.isPhantom) {
      const walletAdapter = getPhantomAdapter()

      walletAdapter.on('disconnect', () => {
        setConnected(false)
        setPubKey(null)
      })

      walletAdapter.on('connect', (key) => {
        setLoading(false)
        setConnected(true)
        setPubKey(key)
      })

      setWallet(walletAdapter)

      walletAdapter.connect({ onlyIfTrusted: true })
    }
  }, [])

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
          console.error(err)
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
