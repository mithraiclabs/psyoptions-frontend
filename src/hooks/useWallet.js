import Wallet from '@project-serum/sol-wallet-adapter'
import { useEffect, useState } from 'react'

import { isBrowser } from '../utils/isNode'

const useWallet = () => {
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState('https://www.sollet.io')
  const [wallet, setWallet] = useState()
  const [connected, setConnected] = useState(false)
  const [pubKey, setPubKey] = useState()

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
