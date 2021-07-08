import { PublicKey, Transaction, Account } from '@solana/web3.js'
import { useCallback } from 'react'
import BN from 'bn.js'
import { OpenOrders, OrderParams } from '@mithraic-labs/serum/lib/market'
import { OptionMarket } from '../types'
import { createAssociatedTokenAccountInstruction } from '../utils/instructions/token'
import useWallet from './useWallet'
import useNotifications from './useNotifications'
import useConnection from './useConnection'
import useSendTransaction from './useSendTransaction'
import useOwnedTokenAccounts from './useOwnedTokenAccounts'
import { SerumMarket } from '../utils/serum'
import {
  useCreateAdHocOpenOrdersSubscription,
  useSettleFunds,
  useSerumOpenOrderAccounts,
} from './Serum'

type PlaceBuyOrderArgs = {
  optionMarket: OptionMarket
  serumMarket: SerumMarket
  orderArgs: OrderParams
  optionDestinationKey?: PublicKey
  settleFunds?: boolean
}

const usePlaceBuyOrder = (
  serumKey: string,
): ((obj: PlaceBuyOrderArgs) => Promise<void>) => {
  const { pushErrorNotification } = useNotifications()
  const { wallet, pubKey } = useWallet()
  const { connection, dexProgramId } = useConnection()
  const { sendSignedTransaction } = useSendTransaction()
  const { subscribeToTokenAccount } = useOwnedTokenAccounts()
  const createAdHocOpenOrdersSub =
    useCreateAdHocOpenOrdersSubscription(serumKey)
  const { makeSettleFundsTx } = useSettleFunds(serumKey)
  const openOrders = useSerumOpenOrderAccounts(serumKey, true)

  return useCallback(
    async ({
      optionMarket,
      serumMarket,
      orderArgs,
      optionDestinationKey,
      settleFunds,
    }: PlaceBuyOrderArgs) => {
      try {
        const txes = []
        const fullOrderArgs = { ...orderArgs }
        const placeBuyOrderTx = new Transaction()
        const _optionDestinationKey = optionDestinationKey
        let signers = []
        let newOpenOrdersAccount

        // Manually create open orders account if one doesn't exist for this market/wallet combo
        if (!openOrders[0]) {
          newOpenOrdersAccount = new Account()
          fullOrderArgs.openOrdersAccount = newOpenOrdersAccount
          console.log(
            `making open orders account: ${newOpenOrdersAccount.publicKey}`,
          )
        } else {
          console.log('open orders account exists')
        }

        if (!_optionDestinationKey) {
          // Create a SPL Token account for this option market if the wallet doesn't have one
          const [createOptAccountIx, newPublicKey] =
            await createAssociatedTokenAccountInstruction({
              payer: pubKey,
              owner: pubKey,
              mintPublicKey: optionMarket.optionMintKey,
            })
          placeBuyOrderTx.add(createOptAccountIx)
          subscribeToTokenAccount(newPublicKey)
        }

        // place the buy order
        const {
          createdOpenOrdersKey,
          transaction: placeOrderTx,
          signers: placeOrderSigners,
        } = await serumMarket.market.makePlaceOrderTransaction(
          connection,
          fullOrderArgs,
        )

        placeBuyOrderTx.add(placeOrderTx)
        signers = [...signers, ...placeOrderSigners]

        if (createdOpenOrdersKey) {
          createAdHocOpenOrdersSub(createdOpenOrdersKey)
        }

        const { blockhash } = await connection.getRecentBlockhash()
        placeBuyOrderTx.recentBlockhash = blockhash
        placeBuyOrderTx.feePayer = pubKey

        if (signers && signers.length > 0) {
          placeBuyOrderTx.partialSign(...signers)
        }

        txes.push(placeBuyOrderTx)

        if (settleFunds) {
          let settleFundsTx
          if (newOpenOrdersAccount) {
            const openOrdersInstance = new OpenOrders(
              newOpenOrdersAccount.publicKey,
              {
                owner: pubKey,
                address: newOpenOrdersAccount.publicKey,
                market: serumMarket.marketAddress,
              },
              dexProgramId,
            )
            settleFundsTx = await makeSettleFundsTx(openOrdersInstance)
          } else {
            settleFundsTx = await makeSettleFundsTx()
          }
          txes.push(settleFundsTx)
        }

        const signed = await wallet.signAllTransactions(txes)

        await sendSignedTransaction({
          signedTransaction: signed[0],
          connection,
          sendingMessage: 'Processing: Buy contracts',
          successMessage: 'Confirmed: Buy contracts',
        })

        if (settleFunds) {
          await sendSignedTransaction({
            signedTransaction: signed[1],
            connection,
            sendingMessage: 'Processing: Settle funds',
            successMessage: 'Confirmed: Settle funds',
          })
        }
      } catch (err) {
        pushErrorNotification(err)
      }
    },
    [
      connection,
      createAdHocOpenOrdersSub,
      pubKey,
      pushErrorNotification,
      sendSignedTransaction,
      subscribeToTokenAccount,
      wallet,
      makeSettleFundsTx,
      openOrders,
      dexProgramId,
    ],
  )
}

export default usePlaceBuyOrder
