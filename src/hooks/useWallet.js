import Wallet from '@project-serum/sol-wallet-adapter'
import { useContext } from 'react'
import { WalletContext } from '../context/WalletContext'

const useWallet = () => {
  const {
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
  } = useContext(WalletContext)

  const connect = async () => {
    setLoading(true)

    const wallet = new Wallet(url)

    setWallet(wallet)

    // TODO: unbind these listeners from old wallet before creating new one
    wallet.on('connect', (key) => {
      setLoading(false)
      setConnected(true)
      setPubKey(key)
    })

    wallet.on('disconnect', () => {
      setConnected(false)
      setPubKey('')
      console.log('Disconnected')
    })

    return await wallet.connect()
  }

  return {
    url,
    setUrl,
    wallet,
    connect,
    connected,
    loading,
    pubKey,
  }
}

export default useWallet

// let transaction = SystemProgram.transfer({
//   fromPubkey: wallet.publicKey,
//   toPubkey: wallet.publicKey,
//   lamports: 100,
// })

// let { blockhash } = await connection.getRecentBlockhash()

// transaction.recentBlockhash = blockhash

// let signed = await wallet.signTransaction(transaction)
// let txid = await connection.sendRawTransaction(signed.serialize())

// await connection.confirmTransaction(txid)
