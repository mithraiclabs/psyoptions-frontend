import Link from '@material-ui/core/Link'
import { Market } from '@mithraic-labs/serum'
import { PublicKey } from '@solana/web3.js'
import React, { useCallback } from 'react'
import { NotificationSeverity } from '../../types'
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
  const { wallet, pubKey } = useWallet()
  const { ownedTokenAccounts } = useOwnedTokenAccounts()
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
    // TODO if the user doesn't have base or quote token account, add it to the TX
    if (
      openOrders.length &&
      quoteTokenAccountAddress &&
      baseTokenAccountAddress
    ) {
      const market = serumMarket?.market as Market | undefined
      const { transaction, signers } = await market.makeSettleFundsTransaction(
        connection,
        openOrders[0],
        new PublicKey(baseTokenAccountAddress),
        new PublicKey(quoteTokenAccountAddress),
      )
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
    baseTokenAccountAddress,
    connection,
    openOrders,
    pubKey,
    pushNotification,
    quoteTokenAccountAddress,
    serumMarket?.market,
    wallet,
  ])
}
