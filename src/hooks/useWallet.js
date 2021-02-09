import Wallet from '@project-serum/sol-wallet-adapter'
import { useEffect, useState } from 'react'

const useWallet = () => {
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState('https://www.sollet.io')
  const [wallet, setWallet] = useState(new Wallet(url))
  const [connected, setConnected] = useState(false)
  const [publicKey, setPublicKey] = useState()
  const [publicKeyb58, setPublicKeyb58] = useState()

  const connect = async (url) => {
    setLoading(true)
    // TODO: setting the url and creating new wallet instance should happen here
    return await wallet.connect()
  }

  useEffect(() => {
    wallet.on('connect', (publicKey) => {
      setLoading(false)
      setConnected(true)
      setPublicKey(publicKey)
      setPublicKeyb58(publicKey.toBase58())
    })

    wallet.on('disconnect', () => {
      setConnected(false)
      setPublicKey('')
      setPublicKeyb58('')
      console.log('Disconnected')
    })

    // connect()
  }, [wallet])

  return {
    url,
    setUrl,
    wallet,
    connect,
    connected,
    loading,
    publicKey,
    publicKeyb58,
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
