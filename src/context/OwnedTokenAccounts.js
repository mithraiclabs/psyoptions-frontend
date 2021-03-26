import React, { createContext, useEffect, useState } from 'react'
import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { Buffer } from 'buffer'
import bs58 from 'bs58'
import PropTypes from 'prop-types'
import useConnection from '../hooks/useConnection'
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

const convertAccountInfoToLocalStruct = (_accountInfo, pubkey) => {
  const amountBuffer = Buffer.from(_accountInfo.amount)
  const amount = amountBuffer.readUintLE(0, 8)
  const mint = new PublicKey(_accountInfo.mint)
    return {
      amount,
      mint,
      // public key for the specific token account (NOT the wallet)
      pubKey: pubkey,
    }
}

/**
 * State for the Wallet's SPL accounts and solana account
 *
 */
const OwnedTokenAccountsProvider = ({ children }) => {
  const { connection } = useConnection()
  const { connected, pubKey } = useWallet()
  const [ownedTokenAccounts, setOwnedTokenAccounts] = useState({})

  useEffect(() => {
    if(!connected || !pubKey) {
      // short circuit when there is no wallet connected
      return () => {}
    }
    
    let subscriptionIds;
    (async () => {
      const filters = getOwnedTokenAccountsFilter(pubKey)
      const resp = await connection._rpcRequest('getProgramAccounts', [
        TOKEN_PROGRAM_ID.toBase58(),
        {
          commitment: connection.commitment,
          filters,
        },
      ])
      const _ownedTokenAccounts = {};
      subscriptionIds = resp.result?.map(({account,  pubkey }) => {
        const accountInfo = AccountLayout.decode(bs58.decode(account.data))
        const initialAccount = convertAccountInfoToLocalStruct(accountInfo, pubkey)
        const mint = initialAccount.mint.toString();
        if (_ownedTokenAccounts[mint]) {
          _ownedTokenAccounts[mint].push(initialAccount)  
        } else {
          _ownedTokenAccounts[mint] = [
            initialAccount 
          ]
        }
        // subscribe to the SPL token account updates
        return connection.onAccountChange(new PublicKey(pubkey), (_account) => {
          const listenerAccountInfo = AccountLayout.decode(_account.data)
          const listenerAccount = convertAccountInfoToLocalStruct(listenerAccountInfo, pubkey)
          setOwnedTokenAccounts(prevOwnedTokenAccounts => {
            const mintAsString = listenerAccount.mint.toString()
            const prevMintState = prevOwnedTokenAccounts[mintAsString];
            const index = prevMintState.findIndex(prevAccount => prevAccount.pubKey === pubkey)
            // replace prev state with updated state
            const mintState = Object.assign([], prevMintState, { 
              [index]: listenerAccount 
            })
            return {
              ...prevOwnedTokenAccounts,
              [mintAsString]: mintState,
            }
          })
        })
      })
      setOwnedTokenAccounts(_ownedTokenAccounts)
    })()

    return () => {
      if (subscriptionIds) {
        subscriptionIds.forEach(connection.removeAccountChangeListener)
      }
    }
  }, [connected, connection, pubKey])

  return (
    <OwnedTokenAccountsContext.Provider
      value={{ ownedTokenAccounts }}
    >
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
