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
    }: {
      numberOfContractsToMint: number
      serumMarket: SerumMarket
      orderArgs: OrderParams
      optionMarket: OptionMarket
      uAsset: Asset
      uAssetTokenAccount: TokenAccount
      mintedOptionDestinationKey?: PublicKey
      writerTokenDestinationKey?: PublicKey
    }) => {
      const transaction = new Transaction()
      let signers = []
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
        transaction.add(createAndMintTx)
        signers = [...signers, ...createAndMintSigners]
        // must overwrite the original payer (aka option src) in case the
        // option(s) were minted to a new Account
        _optionTokenSrcKey = _mintedOptionDestinationKey
        shouldRefreshTokenAccounts = _shouldRefreshTokenAccounts
      }

      console.log('order args ', {
        ...orderArgs,
        payer: _optionTokenSrcKey,
      })
      const {
        transaction: placeOrderTx,
        signers: placeOrderSigners,
      } = await serumMarket.market.makePlaceOrderTransaction(connection, {
        ...orderArgs,
        payer: _optionTokenSrcKey,
      })

      transaction.add(placeOrderTx)
      signers = [...signers, ...placeOrderSigners]

      // Close out the wrapped SOL account so it feels native
      if (optionMarket.uAssetMint === WRAPPED_SOL_ADDRESS) {
        transaction.add(
          Token.createCloseAccountInstruction(
            TOKEN_PROGRAM_ID,
            _uAssetTokenAccount.pubKey,
            pubKey, // Send any remaining SOL to the owner
            pubKey,
            [],
          ),
        )
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
        message: `Processing: Write and sell ${numberOfContractsToMint} contract${
          numberOfContractsToMint > 1 ? 's' : ''
        }`,
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
        message: `Confirmed: Write and sell ${numberOfContractsToMint} contract${
          numberOfContractsToMint > 1 ? 's' : ''
        }`,
        link: (
          <Link href={buildSolanaExplorerUrl(txid)} target="_new">
            View on Solana Explorer
          </Link>
        ),
      })
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
