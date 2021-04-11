import Link from '@material-ui/core/Link'
import { Market } from '@mithraic-labs/serum'
import { PublicKey, Transaction } from '@solana/web3.js'
import React, { useCallback } from 'react'
import { useSolanaMeta } from '../../context/SolanaMetaContext'
import { NotificationSeverity } from '../../types'
import { createNewTokenAccount } from '../../utils/instructions'
import { buildSolanaExplorerUrl } from '../../utils/solanaExplorer'
import { getHighestAccount } from '../../utils/token'
import useConnection from '../useConnection'
import useNotifications from '../useNotifications'
import useOwnedTokenAccounts from '../useOwnedTokenAccounts'
import useSerum from '../useSerum'
import useWallet from '../useWallet'
import { useSerumOpenOrderAccounts } from './useSerumOpenOrderAccounts'

/**
 * Returns function for settling the funds of a specific market
 */
export const useSettleFunds = (key: string): (() => Promise<void>) => {
  const { pushNotification } = useNotifications()
  const { connection } = useConnection()
  const { serumMarkets } = useSerum()
  const { splTokenAccountRentBalance } = useSolanaMeta()
  const { wallet, pubKey } = useWallet()
  const { ownedTokenAccounts, refreshTokenAccounts } = useOwnedTokenAccounts()
  const openOrders = useSerumOpenOrderAccounts(key, true)
  const serumMarket = serumMarkets[key]?.serumMarket
  const [baseMintAddress, quoteMintAddress] = key?.split('-') ?? []
  const baseTokenAccounts = ownedTokenAccounts[baseMintAddress] ?? []
  const quoteTokenAccounts = ownedTokenAccounts[quoteMintAddress] ?? []
  const { pubKey: baseTokenAccountAddress } = getHighestAccount(
    baseTokenAccounts,
  )
  const { pubKey: quoteTokenAccountAddress } = getHighestAccount(
    quoteTokenAccounts,
  )

  return useCallback(async () => {
    const market = serumMarket?.market as Market | undefined
    if (openOrders.length && market) {
      const transaction = new Transaction()
      let signers = []
      let shouldRefreshTokenAccounts = false
      let baseTokenAccountKey = baseTokenAccountAddress
      let quoteTokenAccountKey = quoteTokenAccountAddress

      if (!baseTokenAccountAddress) {
        // Create a SPL Token account for this base account if the wallet doesn't have one
        const {
          transaction: createOptAccountTx,
          newTokenAccount,
        } = createNewTokenAccount({
          fromPubkey: pubKey,
          owner: pubKey,
          mintPublicKey: new PublicKey(baseMintAddress),
          splTokenAccountRentBalance,
        })

        transaction.add(createOptAccountTx)
        signers.push(newTokenAccount)
        baseTokenAccountKey = newTokenAccount.publicKey
        shouldRefreshTokenAccounts = true
      }

      if (!quoteTokenAccountAddress) {
        // Create a SPL Token account for this quote account if the wallet doesn't have one
        const {
          transaction: createOptAccountTx,
          newTokenAccount,
        } = createNewTokenAccount({
          fromPubkey: pubKey,
          owner: pubKey,
          mintPublicKey: new PublicKey(quoteMintAddress),
          splTokenAccountRentBalance,
        })

        transaction.add(createOptAccountTx)
        signers.push(newTokenAccount)
        quoteTokenAccountKey = newTokenAccount.publicKey
        shouldRefreshTokenAccounts = true
      }

      const {
        transaction: settleTx,
        signers: settleSigners,
      } = await market.makeSettleFundsTransaction(
        connection,
        openOrders[0],
        baseTokenAccountKey,
        quoteTokenAccountKey,
      )
      transaction.add(settleTx)
      signers = [...signers, ...settleSigners]

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
        message: 'Processing: Settle funds',
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
        message: 'Confirmed: Settle funds',
        link: (
          <Link href={buildSolanaExplorerUrl(txid)} target="_new">
            View on Solana Explorer
          </Link>
        ),
      })
    }
  }, [
    baseMintAddress,
    baseTokenAccountAddress,
    connection,
    openOrders,
    pubKey,
    pushNotification,
    quoteMintAddress,
    quoteTokenAccountAddress,
    refreshTokenAccounts,
    serumMarket?.market,
    splTokenAccountRentBalance,
    wallet,
  ])
}
