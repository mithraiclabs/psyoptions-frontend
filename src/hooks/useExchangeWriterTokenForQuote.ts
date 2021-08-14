import { useCallback } from 'react'
import { exchangeWriterTokenForQuoteInstruction } from '@mithraic-labs/psyoptions'
import { PublicKey, Transaction } from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import useNotifications from './useNotifications'
import useConnection from './useConnection'
import useWallet from './useWallet'
import useSendTransaction from './useSendTransaction'
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
  const { pushErrorNotification } = useNotifications()
  const { sendTransaction } = useSendTransaction()

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
          payerKey: pubKey,
          mintPublicKey: new PublicKey(WRAPPED_SOL_ADDRESS),
          owner: pubKey,
          rentBalance: splTokenAccountRentBalance,
        })
        transaction.add(initWrappedSolAcctIx)
        signers.push(wrappedSolAccount)
        _quoteAssetDestKey = wrappedSolAccount.publicKey
      }
      const ix = await exchangeWriterTokenForQuoteInstruction({
        programId: new PublicKey(market.psyOptionsProgramId),
        optionMarketKey: market.optionMarketKey,
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

      await sendTransaction({
        transaction,
        wallet,
        signers,
        connection,
        sendingMessage: 'Sending: Burn Writer Token for quote assets',
        successMessage: 'Confirmed: Burn Writer Token for quote assets',
      })
    } catch (err) {
      pushErrorNotification(err)
    }
  }, [
    quoteAssetDestKey,
    market.qAssetMint,
    market.optionMarketKey,
    market.writerTokenMintKey,
    market.quoteAssetPoolKey,
    market.psyOptionsProgramId,
    pubKey,
    writerTokenSourceKey,
    connection,
    wallet,
    pushErrorNotification,
    sendTransaction,
    splTokenAccountRentBalance,
  ])

  return {
    exchangeWriterTokenForQuote: _exchangeWriterTokenFoQuote,
  }
}
