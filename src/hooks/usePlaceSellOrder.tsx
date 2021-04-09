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

// Solana has a maximum packet size when sending a transaction.
// As of writing 40 mints is a good round number that won't breach that limit.
const MAX_MINTS_PER_TX = 40

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
      const mintTXs = []
      const mintSigners = []
      let _uAssetTokenAccount = uAssetTokenAccount
      let _optionTokenSrcKey = mintedOptionDestinationKey
      let _writerTokenDestinationKey = writerTokenDestinationKey;
      let shouldRefreshTokenAccounts = false
      let numberOfContractsDistribution

      // Mint and place order
      if (numberOfContractsToMint > 0) {
        /* Transactions are limited to certain packet size, so we must chunk the transactions
         * if the user wants to mint many contracts at once. */
        const numberOfMintTxs = Math.ceil(
          numberOfContractsToMint / MAX_MINTS_PER_TX,
        )

        numberOfContractsDistribution = new Array(numberOfMintTxs - 1).fill(
          MAX_MINTS_PER_TX,
        )
        numberOfContractsDistribution.push(
          numberOfContractsToMint % MAX_MINTS_PER_TX,
        )
        await Promise.all(
          numberOfContractsDistribution.map(async (contractsToMint) => {
            const tx = new Transaction()
            // Mint missing contracs before placing order
            const { error, response } = await createMissingAccountsAndMint({
              optionsProgramId: new PublicKey(endpoint.programId),
              authorityPubkey: pubKey,
              owner: pubKey,
              market: optionMarket,
              uAsset,
              uAssetTokenAccount: _uAssetTokenAccount,
              splTokenAccountRentBalance,
              numberOfContractsToMint: contractsToMint,
              mintedOptionDestinationKey: _optionTokenSrcKey,
              writerTokenDestinationKey: _writerTokenDestinationKey,
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
              writerTokenDestinationKey: __writerTokenDestinationKey,
              uAssetTokenAccount: __uAssetTokenAccount,
            } = response
            _uAssetTokenAccount = __uAssetTokenAccount

            // Add the create accounts and mint instructions to the TX
            tx.add(createAndMintTx)

            // must overwrite the original payer (aka option src) in case the
            // option(s) were minted to a new Account
            _optionTokenSrcKey = _mintedOptionDestinationKey
            _writerTokenDestinationKey = __writerTokenDestinationKey
            shouldRefreshTokenAccounts = _shouldRefreshTokenAccounts

            // Close out the wrapped SOL account so it feels native
            if (optionMarket.uAssetMint === WRAPPED_SOL_ADDRESS) {
              tx.add(
                Token.createCloseAccountInstruction(
                  TOKEN_PROGRAM_ID,
                  _uAssetTokenAccount.pubKey,
                  pubKey, // Send any remaining SOL to the owner
                  pubKey,
                  [],
                ),
              )
            }
            mintTXs.push(tx)
            mintSigners.push(createAndMintSigners)
          }),
        )
      }

      const {
        transaction: placeOrderTx,
        signers: placeOrderSigners,
      } = await serumMarket.market.makePlaceOrderTransaction(connection, {
        ...orderArgs,
        payer: _optionTokenSrcKey,
      })

      const { blockhash } = await connection.getRecentBlockhash()

      mintTXs.forEach((_mintTx, index) => {
        mintTXs[index].feePayer = pubKey
        mintTXs[index].recentBlockhash = blockhash
        if (mintSigners[index].length) {
          mintTXs[index].partialSign(...mintSigners[index])
        }
      })
      placeOrderTx.feePayer = pubKey
      placeOrderTx.recentBlockhash = blockhash

      if (placeOrderSigners.length) {
        placeOrderTx.partialSign(...placeOrderSigners)
      }

      const signed = await wallet.signAllTransactions([
        ...mintTXs,
        placeOrderTx,
      ])

      await Promise.all(
        mintTXs.map(async (_mintTx, index) => {
          const txid = await connection.sendRawTransaction(
            signed[index].serialize(),
          )
          pushNotification({
            severity: NotificationSeverity.INFO,
            message: `Processing: Write ${
              numberOfContractsDistribution[index]
            } contract${numberOfContractsToMint > 1 ? 's' : ''}`,
            link: (
              <Link href={buildSolanaExplorerUrl(txid)} target="_new">
                View on Solana Explorer
              </Link>
            ),
          })
          await connection.confirmTransaction(txid)

          pushNotification({
            severity: NotificationSeverity.SUCCESS,
            message: `Confirmed: Write ${
              numberOfContractsDistribution[index]
            } contract${numberOfContractsToMint > 1 ? 's' : ''}`,
            link: (
              <Link href={buildSolanaExplorerUrl(txid)} target="_new">
                View on Solana Explorer
              </Link>
            ),
          })
        }),
      )

      const placeOrderTxIndex = mintTXs.length
      const placeOrderTxId = await connection.sendRawTransaction(
        signed[placeOrderTxIndex].serialize(),
      )
      pushNotification({
        severity: NotificationSeverity.INFO,
        message: `Processing: Sell ${orderArgs.size} contract${
          numberOfContractsToMint > 1 ? 's' : ''
        }`,
        link: (
          <Link href={buildSolanaExplorerUrl(placeOrderTxId)} target="_new">
            View on Solana Explorer
          </Link>
        ),
      })
      await connection.confirmTransaction(placeOrderTxId)

      pushNotification({
        severity: NotificationSeverity.SUCCESS,
        message: `Confirmed: Sell ${orderArgs.size} contract${
          numberOfContractsToMint > 1 ? 's' : ''
        }`,
        link: (
          <Link href={buildSolanaExplorerUrl(placeOrderTxId)} target="_new">
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
