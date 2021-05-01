import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import bs58 from 'bs58'
import useConnection from '../hooks/useConnection'
import useWallet from '../hooks/useWallet'
import { TokenAccount } from '../types'
import useNotifications from '../hooks/useNotifications'

export type OwnedTokenAccountsContextT = {
  loadingOwnedTokenAccounts: boolean
  ownedTokenAccounts: Record<string, TokenAccount[]>
  refreshTokenAccounts: () => void
  subscribeToTokenAccount: (pk: PublicKey) => void
}

export const OwnedTokenAccountsContext = createContext<OwnedTokenAccountsContextT>(
  {
    loadingOwnedTokenAccounts: false,
    ownedTokenAccounts: {},
    refreshTokenAccounts: () => {},
    subscribeToTokenAccount: () => {},
  },
)

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

const convertAccountInfoToLocalStruct = (
  _accountInfo,
  pubkey: PublicKey,
): TokenAccount => {
  const amountBuffer = Buffer.from(_accountInfo.amount)
  const amount = amountBuffer.readUIntLE(0, 8)
  return {
    amount,
    mint: new PublicKey(_accountInfo.mint),
    // public key for the specific token account (NOT the wallet)
    pubKey: pubkey,
  }
}

/**
 * State for the Wallet's SPL accounts and solana account.
 *
 * Fetches and subscribes to all of the user's SPL Tokens on mount
 */
export const OwnedTokenAccountsProvider: React.FC = ({ children }) => {
  const { connection } = useConnection()
  const { pushNotification } = useNotifications()
  const { connected, pubKey } = useWallet()
  const [loadingOwnedTokenAccounts, setLoading] = useState(false)
  const [ownedTokenAccounts, setOwnedTokenAccounts] = useState<
    Record<string, TokenAccount[]>
  >({})
  const [refreshCount, setRefreshCount] = useState(0)
  const subscriptionsRef = useRef<Record<string, number>>({})
  const refreshTokenAccounts = useCallback(() => {
    setRefreshCount((count) => count + 1)
  }, [])

  /**
   * Subscribes to the Public Key of a Token Account if it's not currently
   * subscribed to
   */
  const subscribeToTokenAccount = useCallback(
    (publicKey: PublicKey) => {
      if (subscriptionsRef.current[publicKey.toString()]) {
        // short circuit if a subscription already exists
        return
      }
      const subscriptionId = connection.onAccountChange(
        publicKey,
        (_account) => {
          const listenerAccountInfo = AccountLayout.decode(_account.data)
          const listenerAccount = convertAccountInfoToLocalStruct(
            listenerAccountInfo,
            publicKey,
          )
          setOwnedTokenAccounts((prevOwnedTokenAccounts) => {
            const mintAsString = listenerAccount.mint.toString()
            const prevMintState = prevOwnedTokenAccounts[mintAsString]
            let index = prevMintState?.findIndex((prevAccount) =>
              prevAccount.pubKey.equals(publicKey),
            )
            // index may be -1 if the Token Account does not yet exist in our state.
            // In this case, we must set the index to 0 so it will be at the beginning of the array.
            if (index == null || index < 0) {
              index = 0
            }
            // replace prev state with updated state
            const mintState = Object.assign([], prevMintState, {
              [index]: listenerAccount,
            })
            return {
              ...prevOwnedTokenAccounts,
              [mintAsString]: mintState,
            }
          })
        },
      )
      subscriptionsRef.current[publicKey.toString()] = subscriptionId
    },
    [connection],
  )

  useEffect(() => {
    // Clean up subscriptions when component unmounts
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(subscriptionsRef.current).forEach(
        connection.removeAccountChangeListener,
      )
    }
  }, [connection.removeAccountChangeListener])

  useEffect(() => {
    // Fetch and subscribe to Token Account updates on mount
    if (!connected || !pubKey) {
      // short circuit when there is no wallet connected
      return
    }

    ;(async () => {
      const filters = getOwnedTokenAccountsFilter(pubKey)
      setLoading(true)
      try {
        // @ts-expect-error we know what we're doing
        const resp = await connection._rpcRequest('getProgramAccounts', [
          TOKEN_PROGRAM_ID.toBase58(),
          {
            commitment: connection.commitment,
            filters,
          },
        ])
        const _ownedTokenAccounts = {}
        resp.result?.forEach(({ account, pubkey }) => {
          const accountInfo = AccountLayout.decode(bs58.decode(account.data))
          const initialAccount = convertAccountInfoToLocalStruct(
            accountInfo,
            new PublicKey(pubkey),
          )
          const mint = initialAccount.mint.toString()
          if (_ownedTokenAccounts[mint]) {
            _ownedTokenAccounts[mint].push(initialAccount)
          } else {
            _ownedTokenAccounts[mint] = [initialAccount]
          }
          if (!subscriptionsRef.current[pubkey]) {
            // Subscribe to the SPL token account updates only if no subscription exists for this token.
            subscribeToTokenAccount(new PublicKey(pubkey))
          }
        })
        setOwnedTokenAccounts(_ownedTokenAccounts)
      } catch (err) {
        pushNotification({
          severity: 'error',
          message: `${err}`,
        })
      } finally {
        setLoading(false)
      }
    })()
  }, [
    connected,
    connection,
    pubKey,
    pushNotification,
    refreshCount,
    subscribeToTokenAccount,
  ])

  return (
    <OwnedTokenAccountsContext.Provider
      value={{
        loadingOwnedTokenAccounts,
        ownedTokenAccounts,
        refreshTokenAccounts,
        subscribeToTokenAccount,
      }}
    >
      {children}
    </OwnedTokenAccountsContext.Provider>
  )
}
