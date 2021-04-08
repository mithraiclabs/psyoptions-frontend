import React, { useCallback } from 'react'
import { PublicKey, Transaction } from '@solana/web3.js'
import { Link } from '@material-ui/core'

import { SerumMarket } from 'src/utils/serum'
import { OrderParams } from '@mithraic-labs/serum/lib/market'
import {
  Asset,
  NotificationSeverity,
  OptionMarket,
  TokenAccount,
} from '../types'
import useNotifications from './useNotifications'
import useConnection from './useConnection'
import useWallet from './useWallet'
import { buildSolanaExplorerUrl } from '../utils/solanaExplorer'
import { useMintOptions } from './useMintOptions'

type PlaceSellOrderArgs = {
  numberOfContractsToMint: number
  serumMarket: SerumMarket
  orderArgs: OrderParams
  optionMarket: OptionMarket
  uAsset: Asset
  uAssetTokenAccount: TokenAccount
  mintedOptionDestinationKey?: PublicKey
  writerTokenDestinationKey?: PublicKey
}

const usePlaceSellOrder = (): ((obj: PlaceSellOrderArgs) => Promise<void>) => {
  const { pushNotification } = useNotifications()
  const { wallet, pubKey } = useWallet()
  const { connection } = useConnection()
  const mintOptions = useMintOptions()

  return useCallback(
    async ({
      numberOfContractsToMint,
      serumMarket,
      orderArgs,
      optionMarket,
      uAsset,
      uAssetTokenAccount,
      mintedOptionDestinationKey,
      writerTokenDestinationKey,
    }: PlaceSellOrderArgs) => {
      let transaction = new Transaction()
      let signers = []
      let _optionTokenSrcKey = orderArgs.payer

      // Mint and place order
      if (numberOfContractsToMint > 0) {
        // Mint missing contracs before placing order
        _optionTokenSrcKey = await mintOptions({
          numberOfContractsToMint,
          orderArgs,
          optionMarket,
          uAsset,
          uAssetTokenAccount,
          mintedOptionDestinationKey,
          writerTokenDestinationKey,
        })
      }

      transaction = new Transaction()
      signers = []

      const {
        transaction: placeOrderTx,
        signers: placeOrderSigners,
      } = await serumMarket.market.makePlaceOrderTransaction(connection, {
        ...orderArgs,
        payer: _optionTokenSrcKey,
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
        message: `Processing: Sell ${numberOfContractsToMint} contract${
          numberOfContractsToMint > 1 ? 's' : ''
        }`,
        link: (
          <Link href={buildSolanaExplorerUrl(txid)} target="_new">
            View on Solana Explorer
          </Link>
        ),
      })

      await connection.confirmTransaction(txid)

      pushNotification({
        severity: NotificationSeverity.SUCCESS,
        message: `Confirmed: Sell ${numberOfContractsToMint} contract${
          numberOfContractsToMint > 1 ? 's' : ''
        }`,
        link: (
          <Link href={buildSolanaExplorerUrl(txid)} target="_new">
            View on Solana Explorer
          </Link>
        ),
      })
    },
    [connection, mintOptions, pubKey, pushNotification, wallet],
  )
}

export default usePlaceSellOrder
