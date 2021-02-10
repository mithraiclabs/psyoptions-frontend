import Wallet from '@project-serum/sol-wallet-adapter'
import { useEffect, useState } from 'react'

const useWallet = () => {
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState('https://www.sollet.io')
  const [wallet, setWallet] = useState(new Wallet(url))
  const [connected, setConnected] = useState(false)
  const [pubKey, setPubKey] = useState()
  // const [publicKeyb58, setPublicKeyb58] = useState()

  const connect = async (url) => {
    setLoading(true)
    // TODO: setting the url and creating new wallet instance should happen here
    return await wallet.connect()
  }

  useEffect(() => {
    wallet.on('connect', (key) => {
      // console.log(pubKey)
      setLoading(false)
      setConnected(true)
      setPubKey(key)
      // setPublicKeyb58(pubKey.toBase58())
    })

    wallet.on('disconnect', () => {
      setConnected(false)
      setPubKey('')
      // setPublicKeyb58('')
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
