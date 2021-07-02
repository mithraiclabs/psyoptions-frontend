import { Market, OpenOrders } from '@mithraic-labs/serum'
import { PublicKey, Transaction } from '@solana/web3.js'
import { useCallback } from 'react'
import { createAssociatedTokenAccountInstruction } from '../../utils/instructions'
import { getHighestAccount } from '../../utils/token'
import useConnection from '../useConnection'
import useNotifications from '../useNotifications'
import useOwnedTokenAccounts from '../useOwnedTokenAccounts'
import useSerum from '../useSerum'
import useWallet from '../useWallet'
import useSendTransaction from '../useSendTransaction'
import { useSerumOpenOrderAccounts } from './useSerumOpenOrderAccounts'
import useAssetList from '../useAssetList'

/**
 * Returns function for settling the funds of a specific market
 */
export const useSettleFunds = (
  key: string,
): {
  makeSettleFundsTx: (
    openOrdersAccountFallback?: OpenOrders,
  ) => Promise<Transaction>
  settleFunds: () => Promise<void>
} => {
  const { pushErrorNotification } = useNotifications()
  const { connection } = useConnection()
  const { serumMarkets } = useSerum()
  const { wallet, pubKey } = useWallet()
  const { sendTransaction } = useSendTransaction()
  const { USDCPublicKey } = useAssetList()
  const { ownedTokenAccounts, subscribeToTokenAccount } =
    useOwnedTokenAccounts()
  const openOrders = useSerumOpenOrderAccounts(key, true)
  const serumMarket = serumMarkets[key]?.serumMarket
  const [baseMintAddress, quoteMintAddress] = key?.split('-') ?? []
  const baseTokenAccounts = ownedTokenAccounts[baseMintAddress] ?? []
  const quoteTokenAccounts = ownedTokenAccounts[quoteMintAddress] ?? []
  const { pubKey: baseTokenAccountKey } = getHighestAccount(baseTokenAccounts)
  const { pubKey: quoteTokenAccountKey } = getHighestAccount(quoteTokenAccounts)

  const makeSettleFundsTx = useCallback(
    async (
      /**
       * A specific open orders account fallback can be passed in, it will only be used if one doesn't exist on-chain already
       */
      openOrdersAccountFallback?: OpenOrders,
    ): Promise<Transaction | undefined> => {
      const market = serumMarket?.market as Market | undefined
      if (market) {
        const transaction = new Transaction()
        let signers = []
        let _baseTokenAccountKey = baseTokenAccountKey
        let _quoteTokenAccountKey = quoteTokenAccountKey

        if (!_baseTokenAccountKey) {
          // Create a SPL Token account for this base account if the wallet doesn't have one
          const [createOptAccountTx, newTokenAccountKey] =
            await createAssociatedTokenAccountInstruction({
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
          const [createOptAccountTx, newTokenAccountKey] =
            await createAssociatedTokenAccountInstruction({
              payer: pubKey,
              owner: pubKey,
              mintPublicKey: new PublicKey(quoteMintAddress),
            })

          transaction.add(createOptAccountTx)
          _quoteTokenAccountKey = newTokenAccountKey
          subscribeToTokenAccount(newTokenAccountKey)
        }

        const { transaction: settleTx, signers: settleSigners } =
          await market.makeSettleFundsTransaction(
            connection,
            openOrders[0] || openOrdersAccountFallback,
            _baseTokenAccountKey,
            _quoteTokenAccountKey,
            market.quoteMintAddress.equals(USDCPublicKey) &&
              process.env.USDC_SERUM_REFERRER_ADDRESS
              ? new PublicKey(process.env.USDC_SERUM_REFERRER_ADDRESS)
              : undefined,
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
    },
    [
      serumMarket?.market,
      openOrders,
      baseTokenAccountKey,
      quoteTokenAccountKey,
      connection,
      USDCPublicKey,
      pubKey,
      baseMintAddress,
      subscribeToTokenAccount,
      quoteMintAddress,
    ],
  )

  const settleFunds = useCallback(async () => {
    try {
      const transaction = await makeSettleFundsTx()
      sendTransaction({
        transaction,
        wallet,
        connection,
        sendingMessage: 'Processing: Settle funds',
        successMessage: 'Confirmed: Settle funds',
      })
    } catch (err) {
      pushErrorNotification(err)
    }
  }, [
    connection,
    pushErrorNotification,
    sendTransaction,
    wallet,
    makeSettleFundsTx,
  ])

  return {
    settleFunds,
    makeSettleFundsTx,
  }
}
