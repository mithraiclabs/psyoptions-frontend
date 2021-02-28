import React, { createContext, useEffect, useState } from 'react'
import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { Buffer } from 'buffer'
import bs58 from 'bs58'
import PropTypes from 'prop-types'
import useConnection from '../hooks/useConnection'
import useWallet from '../hooks/useWallet'

// Not sure where this should live
const SOLANA_MINT_ADDRESS = 'So11111111111111111111111111111111111111112'

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

/**
 * State for the Wallet's SPL accounts and solana account
 *
 */
const OwnedTokenAccountsProvider = ({ children }) => {
  const { connection } = useConnection()
  const { connected, pubKey } = useWallet()
  const [ownedTokenAccounts, setOwnedTokenAccounts] = useState({})

  useEffect(() => {
    // TODO need to find the best way to update when the user adds new programs
    if (connected && pubKey) {
      ;(async () => {
        const filters = getOwnedTokenAccountsFilter(pubKey)
        try {
          const [solBalance, resp] = await Promise.all([
            connection.getBalance(pubKey),
            connection._rpcRequest('getProgramAccounts', [
              TOKEN_PROGRAM_ID.toBase58(),
              {
                commitment: connection.commitment,
                filters,
              },
            ]),
          ])
          const _ownedTokenAccounts = resp.result?.reduce(
            (acc, { account, pubkey }) => {
              const accountInfo = AccountLayout.decode(
                bs58.decode(account.data),
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
            {},
          )
          setOwnedTokenAccounts({
            // Must prepend the SOL token since it's not returned with token accounts
            [SOLANA_MINT_ADDRESS]: [
              {
                amount: solBalance,
                mint: new PublicKey(SOLANA_MINT_ADDRESS),
                pubKey: pubKey.toString(),
              },
            ],
            ..._ownedTokenAccounts,
          })
        } catch (err) {
          // TODO add toast or something for better error handling
          console.error(err)
        }
      })()
    }
  }, [connected, connection, pubKey])

  return (
    <OwnedTokenAccountsContext.Provider value={ownedTokenAccounts}>
      {children}
    </OwnedTokenAccountsContext.Provider>
  )
}

OwnedTokenAccountsProvider.propTypes = {
  children: PropTypes.node,
}

OwnedTokenAccountsProvider.defaultProps = {
  children: null,
}

export { OwnedTokenAccountsContext, OwnedTokenAccountsProvider }
