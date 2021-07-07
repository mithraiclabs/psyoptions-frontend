import { PublicKey, Transaction, Account } from '@solana/web3.js'
import { useCallback } from 'react'
import { OrderParams, OpenOrders } from '@mithraic-labs/serum/lib/market'
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

        // Manually create open orders account tx if one doesn't exist for this serum market
        let newOpenOrdersAccount
        let newOpenOrdersAccountKeypair
        let newOpenOrdersAccountIx
        if (!openOrders[0]) {
          console.log('making open orders account tx')
          newOpenOrdersAccountKeypair = new Account()
          newOpenOrdersAccount = new OpenOrders(
            newOpenOrdersAccountKeypair.publicKey,
            {
              accountFlags: {},
              market: serumMarket.marketAddress,
              owner: pubKey,
            },
            dexProgramId,
          )
          newOpenOrdersAccountIx =
            await OpenOrders.makeCreateAccountTransaction(
              connection,
              serumMarket.marketAddress,
              pubKey,
              newOpenOrdersAccount, // create this
              dexProgramId,
            )
          console.log('done')
        } else {
          console.log('open orders account exists')
        }

        const placeBuyOrderTx = new Transaction()
        let signers = []
        const _optionDestinationKey = optionDestinationKey

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

        const fullOrderArgs = { ...orderArgs }

        if (newOpenOrdersAccountIx) {
          // Add the open orders account specifically
          placeBuyOrderTx.add(newOpenOrdersAccountIx)
          fullOrderArgs.openOrdersAddressKey =
            newOpenOrdersAccountKeypair.publicKey
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

        // if (newOpenOrdersAccountIx) {
        //   signers.push(newOpenOrdersAccountKeypair)
        // }

        if (createdOpenOrdersKey) {
          createAdHocOpenOrdersSub(createdOpenOrdersKey)
        } else if (newOpenOrdersAccountKeypair?.publicKey) {
          createAdHocOpenOrdersSub(newOpenOrdersAccountKeypair?.publicKey)
        }

        const { blockhash } = await connection.getRecentBlockhash()
        placeBuyOrderTx.recentBlockhash = blockhash
        placeBuyOrderTx.feePayer = pubKey
        console.log(signers)

        if (signers && signers.length > 0) {
          placeBuyOrderTx.partialSign(...signers)
        }

        txes.push(placeBuyOrderTx)

        if (settleFunds) {
          const settleFundsTx = openOrders[0]
            ? await makeSettleFundsTx()
            : await makeSettleFundsTx(newOpenOrdersAccount)
          txes.push(settleFundsTx)
        }

        console.log(txes)

        const signed = await wallet.signAllTransactions(txes)
        console.log('signed')

        return

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
