import React, { createContext, useState } from 'react'

const WalletContext = createContext({})

const WalletProvider = ({ children }) => {
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState('https://www.sollet.io')
  const [wallet, setWallet] = useState()
  const [connected, setConnected] = useState(false)
  const [pubKey, setPubKey] = useState()

  // TODO: move all this into a useReducer() state, get rid of useState() here

  const state = {
    loading,
    setLoading,
    url,
    setUrl,
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
