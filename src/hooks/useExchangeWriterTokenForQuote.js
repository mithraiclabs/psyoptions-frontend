import React, { useCallback } from 'react'
import { exchangeWriterTokenForQuoteInstruction } from '@mithraic-labs/psyoptions'
import { Link } from '@material-ui/core'
import { PublicKey, Transaction } from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import useNotifications from './useNotifications'
import useConnection from './useConnection'
import useWallet from './useWallet'
import { buildSolanaExplorerUrl } from '../utils/solanaExplorer'
import { initializeTokenAccountTx, WRAPPED_SOL_ADDRESS } from '../utils/token'
import { useSolanaMeta } from '../context/SolanaMetaContext'

/**
 * Allow user to burn a Writer Token in exchange for Quote Asset in the
 * Quote Asset Pool
 *
 * @param {*} market
 * @param {*} writerTokenSourceKey
 * @param {*} _quoteAssetDestKey
 * @returns
 */
export const useExchangeWriterTokenForQuote = (
  market,
  writerTokenSourceKey,
  quoteAssetDestKey,
) => {
  const { connection, endpoint } = useConnection()
  const { pubKey, wallet } = useWallet()
  const { splTokenAccountRentBalance } = useSolanaMeta()
  const { pushNotification } = useNotifications()

  const _exchangeWriterTokenFoQuote = useCallback(async () => {
    try {
      const transaction = new Transaction()
      const signers = []
      let _quoteAssetDestKey = quoteAssetDestKey
      if (market.qAssetMint === WRAPPED_SOL_ADDRESS) {
        // quote is wrapped sol, must create account to transfer and close
        const {
          transaction: initWrappedSolAcctIx,
          newTokenAccount: wrappedSolAccount,
        } = await initializeTokenAccountTx({
          connection,
          payer: { publicKey: pubKey },
          mintPublicKey: new PublicKey(WRAPPED_SOL_ADDRESS),
          owner: pubKey,
          rentBalance: splTokenAccountRentBalance,
        })
        transaction.add(initWrappedSolAcctIx)
        signers.push(wrappedSolAccount)
        _quoteAssetDestKey = wrappedSolAccount.publicKey
      }
      const ix = await exchangeWriterTokenForQuoteInstruction({
        programId: new PublicKey(endpoint.programId),
        optionMarketKey: market.optionMarketKey,
        optionMintKey: market.optionMintKey,
        writerTokenMintKey: market.writerTokenMintKey,
        writerTokenSourceAuthorityKey: pubKey,
        quoteAssetPoolKey: market.quoteAssetPoolKey,
        writerTokenSourceKey,
        quoteAssetDestKey: _quoteAssetDestKey,
      })
      transaction.add(ix)

      // Close out the wrapped SOL account so it feels native
      if (market.qAssetMint === WRAPPED_SOL_ADDRESS) {
        transaction.add(
          Token.createCloseAccountInstruction(
            TOKEN_PROGRAM_ID,
            _quoteAssetDestKey,
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
        severity: 'info',
        message: `Submitted Transaction: Close Position`,
        link: (
          <Link href={buildSolanaExplorerUrl(txid)} target="_new">
            View on Solana Explorer
          </Link>
        ),
      })
      await connection.confirmTransaction(txid)
      pushNotification({
        severity: 'success',
        message: `Transaction Confirmed: Close Position`,
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
  }, [
    quoteAssetDestKey,
    market.qAssetMint,
    market.optionMarketKey,
    market.optionMintKey,
    market.writerTokenMintKey,
    market.quoteAssetPoolKey,
    endpoint.programId,
    pubKey,
    writerTokenSourceKey,
    connection,
    wallet,
    pushNotification,
    splTokenAccountRentBalance,
  ])

  return {
    exchangeWriterTokenForQuote: _exchangeWriterTokenFoQuote,
  }
}
