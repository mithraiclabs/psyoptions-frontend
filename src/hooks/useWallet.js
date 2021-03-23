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

    const w = new Wallet(url)

    setWallet(w)

    // TODO: unbind these listeners from old wallet before creating new one
    w.on('connect', (key) => {
      setLoading(false)
      setConnected(true)
      setPubKey(key)
    })

    w.on('disconnect', () => {
      setConnected(false)
      setPubKey('')
      console.log('Disconnected')
    })

    // eslint-disable-next-line
    return await w.connect()
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
