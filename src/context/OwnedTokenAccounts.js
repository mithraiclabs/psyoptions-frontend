import React, { createContext, useEffect } from 'react'
import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { Buffer } from 'buffer'
import bs58 from 'bs58'
import useConnection from '../hooks/useConnection'
import { useOwnedTokenAccountsLocalStorage } from '../hooks/useLocalStorage'
import useWallet from '../hooks/useWallet'

const OwnedTokenAccountsContext = createContext({})

const getOwnedTokenAccountsFilter = (publicKey) => [
  {
    memcmp: {
      offset: AccountLayout.offsetOf('owner'),
      bytes: publicKey?.toBase58(),
    },
  },
  {
    dataSize: AccountLayout.span,
  },
]

const OwnedTokenAccountsProvider = ({ children }) => {
  const { connection } = useConnection()
  const { connected, pubKey } = useWallet()
  const [
    ownedTokenAccounts,
    setOwnedTokenAccounts,
  ] = useOwnedTokenAccountsLocalStorage()

  useEffect(() => {
    // TODO need to find the best way to update when the user adds new programs
    if (connected) {
      ;(async () => {
        const filters = getOwnedTokenAccountsFilter(pubKey)
        try {
          const resp = await connection._rpcRequest('getProgramAccounts', [
            TOKEN_PROGRAM_ID.toBase58(),
            {
              commitment: connection.commitment,
              filters,
            },
          ])
          const ownedTokenAccounts = resp.result?.reduce(
            (acc, { account, pubkey }) => {
              const accountInfo = AccountLayout.decode(
                bs58.decode(account.data)
              )
              const amountBuffer = Buffer.from(accountInfo.amount)
              const amount = amountBuffer.readUintLE(0, 8)
              const mint = new PublicKey(accountInfo.mint)
              acc[mint.toString()] = [
                {
                  amount,
                  mint,
                  // public key for the specific token account (NOT the wallet)
                  pubKey: pubkey,
                },
              ]
              return acc
            },
            {}
          )
          setOwnedTokenAccounts(ownedTokenAccounts)
        } catch (err) {
          // TODO add toast or something for better error handling
          console.error(err)
        }
      })()
    }
  }, [connected, pubKey])

  return (
    <OwnedTokenAccountsContext.Provider value={ownedTokenAccounts}>
      {children}
    </OwnedTokenAccountsContext.Provider>
  )
}

export { OwnedTokenAccountsContext, OwnedTokenAccountsProvider }
