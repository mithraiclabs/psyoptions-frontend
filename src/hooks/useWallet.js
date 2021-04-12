import { useContext } from 'react'
import { WalletContext } from '../context/WalletContext'

const useWallet = () => {
  const {
    balance,
    loading,
    setLoading,
    url,
    wallet,
    setWallet,
    connected,
    setConnected,
    pubKey,
    setPubKey,
  } = useContext(WalletContext)

  const connect = async (walletAdapter) => {
    // Reset state in case user is changing wallets
    setPubKey(null)
    setConnected(false)
    setLoading(true)

    setWallet(walletAdapter)

    walletAdapter.on('disconnect', () => {
      setConnected(false)
      setPubKey('')
      console.log('Disconnected')
    })

    // await new Promise((resolve) => {
    walletAdapter.on('connect', (key) => {
      setLoading(false)
      setConnected(true)
      setPubKey(key)
      console.log('connected')
      // resolve()
    })
    // })

    await walletAdapter.connect()
  }

  const disconnect = () => {
    wallet.disconnect()
    setPubKey(null)
    setConnected(false)
  }

  return {
    balance,
    url,
    wallet,
    connect,
    disconnect,
    connected,
    loading,
    pubKey,
  }
}

export default useWallet
