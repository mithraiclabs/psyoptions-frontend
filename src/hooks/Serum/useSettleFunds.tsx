import Link from '@material-ui/core/Link'
import { Market } from '@mithraic-labs/serum'
import { PublicKey, Transaction } from '@solana/web3.js'
import React, { useCallback } from 'react'
import { NotificationSeverity } from '../../types'
import { createAssociatedTokenAccountInstruction } from '../../utils/instructions'
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
export const useSettleFunds = (
  key: string,
): {
  makeSettleFundsTx: () => Promise<Transaction>
  settleFunds: () => Promise<void>
} => {
  const { pushNotification } = useNotifications()
  const { connection } = useConnection()
  const { serumMarkets } = useSerum()
  const { wallet, pubKey } = useWallet()
  const {
    ownedTokenAccounts,
    subscribeToTokenAccount,
  } = useOwnedTokenAccounts()
  const openOrders = useSerumOpenOrderAccounts(key, true)
  const serumMarket = serumMarkets[key]?.serumMarket
  const [baseMintAddress, quoteMintAddress] = key?.split('-') ?? []
  const baseTokenAccounts = ownedTokenAccounts[baseMintAddress] ?? []
  const quoteTokenAccounts = ownedTokenAccounts[quoteMintAddress] ?? []
  const { pubKey: baseTokenAccountKey } = getHighestAccount(baseTokenAccounts)
  const { pubKey: quoteTokenAccountKey } = getHighestAccount(quoteTokenAccounts)

  const makeSettleFundsTx = useCallback(async (): Promise<
    Transaction | undefined
  > => {
    const market = serumMarket?.market as Market | undefined
    if (openOrders.length && market) {
      const transaction = new Transaction()
      let signers = []
      let _baseTokenAccountKey = baseTokenAccountKey
      let _quoteTokenAccountKey = quoteTokenAccountKey

      if (!_baseTokenAccountKey) {
        // Create a SPL Token account for this base account if the wallet doesn't have one
        const [
          createOptAccountTx,
          newTokenAccountKey,
        ] = await createAssociatedTokenAccountInstruction({
          payer: pubKey,
          owner: pubKey,
          mintPublicKey: new PublicKey(baseMintAddress),
        })

        transaction.add(createOptAccountTx)
        _baseTokenAccountKey = newTokenAccountKey
        subscribeToTokenAccount(newTokenAccountKey)
      }

      if (!quoteTokenAccountKey) {
        // Create a SPL Token account for this quote account if the wallet doesn't have one
        const [
          createOptAccountTx,
          newTokenAccountKey,
        ] = await createAssociatedTokenAccountInstruction({
          payer: pubKey,
          owner: pubKey,
          mintPublicKey: new PublicKey(quoteMintAddress),
        })

        transaction.add(createOptAccountTx)
        _quoteTokenAccountKey = newTokenAccountKey
        subscribeToTokenAccount(newTokenAccountKey)
      }

      const {
        transaction: settleTx,
        signers: settleSigners,
      } = await market.makeSettleFundsTransaction(
        connection,
        openOrders[0],
        _baseTokenAccountKey,
        _quoteTokenAccountKey,
      )
      transaction.add(settleTx)
      signers = [...signers, ...settleSigners]

      transaction.feePayer = pubKey
      const { blockhash } = await connection.getRecentBlockhash()
      transaction.recentBlockhash = blockhash

      if (signers.length) {
        transaction.partialSign(...signers)
      }
      return transaction
    }
    return undefined
  }, [
    connection,
    baseMintAddress,
    quoteMintAddress,
    pubKey,
    serumMarket,
    openOrders,
    baseTokenAccountKey,
    quoteTokenAccountKey,
    subscribeToTokenAccount,
  ])

  const settleFunds = useCallback(async () => {
    try {
      const transaction = await makeSettleFundsTx()

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

      pushNotification({
        severity: NotificationSeverity.SUCCESS,
        message: 'Confirmed: Settle funds',
        link: (
          <Link href={buildSolanaExplorerUrl(txid)} target="_new">
            View on Solana Explorer
          </Link>
        ),
      })
    } catch (err) {
      pushNotification({
        severity: 'error',
        message: `${err}`,
      })
    }
  }, [connection, pushNotification, wallet, makeSettleFundsTx])

  return {
    settleFunds,
    makeSettleFundsTx,
  }
}
