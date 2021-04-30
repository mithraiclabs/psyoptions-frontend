import { PublicKey, Transaction } from '@solana/web3.js'
import React, { useCallback } from 'react'
import { OrderParams } from '@mithraic-labs/serum/lib/market'
import Link from '@material-ui/core/Link'
import { NotificationSeverity, OptionMarket } from '../types'
import { createAssociatedTokenAccountInstruction } from '../utils/instructions/token'
import useWallet from './useWallet'
import useNotifications from './useNotifications'
import useConnection from './useConnection'
import useOwnedTokenAccounts from './useOwnedTokenAccounts'
import { SerumMarket } from '../utils/serum'
import { buildSolanaExplorerUrl } from '../utils/solanaExplorer'
import { useCreateAdHocOpenOrdersSubscription } from './Serum'

type PlaceBuyOrderArgs = {
  optionMarket: OptionMarket
  serumMarket: SerumMarket
  orderArgs: OrderParams
  optionDestinationKey?: PublicKey
}

const usePlaceBuyOrder = (
  serumKey: string,
): ((obj: PlaceBuyOrderArgs) => Promise<void>) => {
  const { pushNotification } = useNotifications()
  const { wallet, pubKey } = useWallet()
  const { connection } = useConnection()
  const { subscribeToTokenAccount } = useOwnedTokenAccounts()
  const createAdHocOpenOrdersSub = useCreateAdHocOpenOrdersSubscription(
    serumKey,
  )

  return useCallback(
    async ({
      optionMarket,
      serumMarket,
      orderArgs,
      optionDestinationKey,
    }: PlaceBuyOrderArgs) => {
      const transaction = new Transaction()
      let signers = []
      const _optionDestinationKey = optionDestinationKey

      if (!_optionDestinationKey) {
        // Create a SPL Token account for this option market if the wallet doesn't have one
        const [
          createOptAccountIx,
          newPublicKey,
        ] = await createAssociatedTokenAccountInstruction({
          payer: pubKey,
          owner: pubKey,
          mintPublicKey: optionMarket.optionMintKey,
        })

        transaction.add(createOptAccountIx)
        subscribeToTokenAccount(newPublicKey)
      }
      // place the buy order
      const {
        createdOpenOrdersKey,
        transaction: placeOrderTx,
        signers: placeOrderSigners,
      } = await serumMarket.market.makePlaceOrderTransaction(connection, {
        ...orderArgs,
      })
      transaction.add(placeOrderTx)
      signers = [...signers, ...placeOrderSigners]

      if (createdOpenOrdersKey) {
        createAdHocOpenOrdersSub(createdOpenOrdersKey)
      }

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
      createAdHocOpenOrdersSub,
      pubKey,
      pushNotification,
      subscribeToTokenAccount,
      wallet,
    ],
  )
}

export default usePlaceBuyOrder
