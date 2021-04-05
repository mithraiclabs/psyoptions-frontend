import { PublicKey, Transaction } from '@solana/web3.js'
import React, { useCallback } from 'react'
import { OrderParams } from '@mithraic-labs/serum/lib/market'
import Link from '@material-ui/core/Link'
import { NotificationSeverity, OptionMarket } from '../types'
import { createNewTokenAccount } from '../utils/instructions/token'
import { useSolanaMeta } from '../context/SolanaMetaContext'
import useWallet from './useWallet'
import useNotifications from './useNotifications'
import useConnection from './useConnection'
import useOwnedTokenAccounts from './useOwnedTokenAccounts'
import { SerumMarket } from '../utils/serum'
import { buildSolanaExplorerUrl } from '../utils/solanaExplorer'

const usePlaceBuyOrder = () => {
  const { pushNotification } = useNotifications()
  const { wallet, pubKey } = useWallet()
  const { connection } = useConnection()
  const { splTokenAccountRentBalance } = useSolanaMeta()
  // Not happy about this, but it keeps TS from yelling
  const { refreshTokenAccounts } = useOwnedTokenAccounts() as {
    refreshTokenAccounts: () => void
  }

  return useCallback(
    async ({
      optionMarket,
      serumMarket,
      orderArgs,
      optionDestinationKey,
    }: {
      optionMarket: OptionMarket
      serumMarket: SerumMarket
      orderArgs: OrderParams
      optionDestinationKey?: PublicKey
    }) => {
      const transaction = new Transaction()
      let signers = []
      const _optionDestinationKey = optionDestinationKey
      let shouldRefreshTokenAccounts = false

      if (!_optionDestinationKey) {
        // Create a SPL Token account for this option market if the wallet doesn't have one
        const {
          transaction: createOptAccountTx,
          newTokenAccount,
        } = createNewTokenAccount({
          fromPubkey: pubKey,
          owner: pubKey,
          mintPublicKey: optionMarket.optionMintKey,
          splTokenAccountRentBalance,
        })

        transaction.add(createOptAccountTx)
        signers.push(newTokenAccount)
        shouldRefreshTokenAccounts = true
      }
      // place the buy order
      const {
        transaction: placeOrderTx,
        signers: placeOrderSigners,
      } = await serumMarket.market.makePlaceOrderTransaction(connection, {
        ...orderArgs,
      })
      transaction.add(placeOrderTx)
      signers = [...signers, ...placeOrderSigners]

      transaction.feePayer = pubKey
      const { blockhash } = await connection.getRecentBlockhash()
      transaction.recentBlockhash = blockhash

      if (signers.length) {
        transaction.partialSign(...signers)
      }
      const signed = await wallet.signTransaction(transaction)
      const txid = await connection.sendRawTransaction(signed.serialize())

      pushNotification({
        severity: NotificationSeverity.INFO,
        message: 'Processing: Buy contracts',
        link: (
          <Link href={buildSolanaExplorerUrl(txid)} target="_new">
            View on Solana Explorer
          </Link>
        ),
      })

      await connection.confirmTransaction(txid)

      if (shouldRefreshTokenAccounts) {
        refreshTokenAccounts()
      }

      pushNotification({
        severity: NotificationSeverity.SUCCESS,
        message: 'Confirmed: Buy contracts',
        link: (
          <Link href={buildSolanaExplorerUrl(txid)} target="_new">
            View on Solana Explorer
          </Link>
        ),
      })
    },
    [
      connection,
      pubKey,
      pushNotification,
      refreshTokenAccounts,
      splTokenAccountRentBalance,
      wallet,
    ],
  )
}

export default usePlaceBuyOrder
