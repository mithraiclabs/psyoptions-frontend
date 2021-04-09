import React, { useCallback } from 'react'
import { PublicKey, Transaction } from '@solana/web3.js'
import { Link } from '@material-ui/core'

import { SerumMarket } from 'src/utils/serum'
import { OrderParams } from '@mithraic-labs/serum/lib/market'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  Asset,
  NotificationSeverity,
  OptionMarket,
  TokenAccount,
} from '../types'
import { WRAPPED_SOL_ADDRESS } from '../utils/token'
import useNotifications from './useNotifications'
import useOwnedTokenAccounts from './useOwnedTokenAccounts'
import { useSolanaMeta } from '../context/SolanaMetaContext'
import useConnection from './useConnection'
import useWallet from './useWallet'
import { createMissingAccountsAndMint } from '../utils/instructions/index'
import { buildSolanaExplorerUrl } from '../utils/solanaExplorer'

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

const usePlaceSellOrder = () => {
  const { pushNotification } = useNotifications()
  const { wallet, pubKey } = useWallet()
  const { connection, endpoint } = useConnection()
  const { splTokenAccountRentBalance } = useSolanaMeta()
  // Not happy about this, but it keeps TS from yelling
  const { refreshTokenAccounts } = useOwnedTokenAccounts() as {
    refreshTokenAccounts: () => void
  }

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
      const tx1 = new Transaction()
      const tx2 = new Transaction()
      let mintSigners = []
      let _uAssetTokenAccount = uAssetTokenAccount
      let _optionTokenSrcKey = orderArgs.payer
      let shouldRefreshTokenAccounts = false

      // Mint and place order
      if (numberOfContractsToMint > 0) {
        // Mint missing contracs before placing order
        const { error, response } = await createMissingAccountsAndMint({
          optionsProgramId: new PublicKey(endpoint.programId),
          authorityPubkey: pubKey,
          owner: pubKey,
          market: optionMarket,
          uAsset,
          uAssetTokenAccount: _uAssetTokenAccount,
          splTokenAccountRentBalance,
          numberOfContractsToMint,
          mintedOptionDestinationKey,
          writerTokenDestinationKey,
        })
        if (error) {
          console.error(error)
          pushNotification(error)
          return
        }
        const {
          transaction: createAndMintTx,
          signers: createAndMintSigners,
          shouldRefreshTokenAccounts: _shouldRefreshTokenAccounts,
          mintedOptionDestinationKey: _mintedOptionDestinationKey,
          writerTokenDestinationKey: _writerTokenDestinationKey,
          uAssetTokenAccount: __uAssetTokenAccount,
        } = response
        _uAssetTokenAccount = __uAssetTokenAccount

        // Add the create accounts and mint instructions to the TX
        tx1.add(createAndMintTx)
        mintSigners = [...mintSigners, ...createAndMintSigners]
        // must overwrite the original payer (aka option src) in case the
        // option(s) were minted to a new Account
        _optionTokenSrcKey = _mintedOptionDestinationKey
        shouldRefreshTokenAccounts = _shouldRefreshTokenAccounts
      }

      // Close out the wrapped SOL account so it feels native
      if (optionMarket.uAssetMint === WRAPPED_SOL_ADDRESS) {
        tx1.add(
          Token.createCloseAccountInstruction(
            TOKEN_PROGRAM_ID,
            _uAssetTokenAccount.pubKey,
            pubKey, // Send any remaining SOL to the owner
            pubKey,
            [],
          ),
        )
      }

      const {
        transaction: placeOrderTx,
        signers: placeOrderSigners,
      } = await serumMarket.market.makePlaceOrderTransaction(connection, {
        ...orderArgs,
        payer: _optionTokenSrcKey,
      })

      tx2.add(placeOrderTx)

      tx1.feePayer = pubKey
      tx2.feePayer = pubKey
      const { blockhash } = await connection.getRecentBlockhash()
      tx1.recentBlockhash = blockhash
      tx2.recentBlockhash = blockhash

      if (mintSigners.length) {
        tx1.partialSign(...mintSigners)
      }
      if (placeOrderSigners.length) {
        tx2.partialSign(...placeOrderSigners)
      }

      const signed = await wallet.signAllTransactions([tx1, tx2])

      const txid1 = await connection.sendRawTransaction(signed[0].serialize())
      pushNotification({
        severity: NotificationSeverity.INFO,
        message: `Processing: Write ${numberOfContractsToMint} contract${
          numberOfContractsToMint > 1 ? 's' : ''
        }`,
        link: (
          <Link href={buildSolanaExplorerUrl(txid1)} target="_new">
            View on Solana Explorer
          </Link>
        ),
      })
      await connection.confirmTransaction(txid1)

      pushNotification({
        severity: NotificationSeverity.SUCCESS,
        message: `Confirmed: Write ${numberOfContractsToMint} contract${
          numberOfContractsToMint > 1 ? 's' : ''
        }`,
        link: (
          <Link href={buildSolanaExplorerUrl(txid1)} target="_new">
            View on Solana Explorer
          </Link>
        ),
      })

      const txid2 = await connection.sendRawTransaction(signed[1].serialize())
      pushNotification({
        severity: NotificationSeverity.INFO,
        message: `Processing: Sell ${numberOfContractsToMint} contract${
          numberOfContractsToMint > 1 ? 's' : ''
        }`,
        link: (
          <Link href={buildSolanaExplorerUrl(txid2)} target="_new">
            View on Solana Explorer
          </Link>
        ),
      })
      await connection.confirmTransaction(txid2)

      pushNotification({
        severity: NotificationSeverity.SUCCESS,
        message: `Confirmed: Sell ${numberOfContractsToMint} contract${
          numberOfContractsToMint > 1 ? 's' : ''
        }`,
        link: (
          <Link href={buildSolanaExplorerUrl(txid2)} target="_new">
            View on Solana Explorer
          </Link>
        ),
      })

      if (shouldRefreshTokenAccounts) {
        refreshTokenAccounts()
      }
    },
    [
      connection,
      endpoint,
      pubKey,
      pushNotification,
      refreshTokenAccounts,
      splTokenAccountRentBalance,
      wallet,
    ],
  )
}

export default usePlaceSellOrder
