import { useCallback } from 'react'
import { PublicKey, Transaction } from '@solana/web3.js'
import { closePostExpirationCoveredCallInstruction } from '@mithraic-labs/psyoptions'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import useConnection from './useConnection'
import useWallet from './useWallet'
import useNotifications from './useNotifications'
import useSendTransaction from './useSendTransaction'
import { initializeTokenAccountTx, WRAPPED_SOL_ADDRESS } from '../utils/token'
import { useSolanaMeta } from '../context/SolanaMetaContext'

// Solana has a maximum packet size when sending a transaction.
// As of writing 25 mints is a good round number that won't
// breach that limit when OptionToken and WriterToken accounts
// are included in TX.
const maxClosesPerTx = 25

/**
 * Close the Option the wallet has written in order to return the
 * underlying asset to the option writer
 *
 * @param market Market for the option to be closed
 * @param underlyingAssetDestKEy PublicKey where the unlocked underlying asset will be sent
 * @param writerTokenSourceKey PublicKey of the address where the Writer Token will be burned from
 */

export const useCloseWrittenOptionPostExpiration = (
  market,
  underlyingAssetDestKey,
  writerTokenSourceKey,
) => {
  const { connection, endpoint } = useConnection()
  const { pushErrorNotification } = useNotifications()
  const { pubKey, wallet } = useWallet()
  const { splTokenAccountRentBalance } = useSolanaMeta()
  const { sendSignedTransaction } = useSendTransaction()

  const closeOptionPostExpiration = useCallback(
    async (contractsToClose = 1) => {
      try {
        let remaining = contractsToClose
        const closeTxs = []

        while (remaining > 0) {
          const transaction = new Transaction()
          const signers = []
          let _underlyingAssetDestKey = underlyingAssetDestKey
          if (market.uAssetMint === WRAPPED_SOL_ADDRESS) {
            // need to create a sol account
            const {
              transaction: initWrappedSolAcctIx,
              newTokenAccount: wrappedSolAccount,
            } = await initializeTokenAccountTx({
              // eslint-disable-line
              connection,
              payerKey: pubKey,
              mintPublicKey: new PublicKey(WRAPPED_SOL_ADDRESS),
              owner: pubKey,
              rentBalance: splTokenAccountRentBalance,
            })
            transaction.add(initWrappedSolAcctIx)
            signers.push(wrappedSolAccount)
            _underlyingAssetDestKey = wrappedSolAccount.publicKey
          }
          const ix = await closePostExpirationCoveredCallInstruction({
            programId: new PublicKey(endpoint.programId),
            optionMarketKey: market.optionMarketKey,
            underlyingAssetDestKey: _underlyingAssetDestKey,
            underlyingAssetPoolKey: market.underlyingAssetPoolKey,
            writerTokenMintKey: market.writerTokenMintKey,
            writerTokenSourceKey,
            writerTokenSourceAuthorityKey: pubKey,
          })

          // loop this by # of times given by parameter
          const loopRemaining = remaining
          for (
            let i = 1;
            i <= Math.min(maxClosesPerTx, loopRemaining);
            i += 1
          ) {
            transaction.add(ix)
            remaining -= 1
          }

          // Close out the wrapped SOL account so it feels native
          if (market.uAssetMint === WRAPPED_SOL_ADDRESS) {
            transaction.add(
              Token.createCloseAccountInstruction(
                TOKEN_PROGRAM_ID,
                _underlyingAssetDestKey,
                pubKey, // Send any remaining SOL to the owner
                pubKey,
                [],
              ),
            )
          }
          transaction.feePayer = pubKey
          const { blockhash } = await connection.getRecentBlockhash() // eslint-disable-line
          transaction.recentBlockhash = blockhash

          if (signers.length) {
            transaction.partialSign(...signers)
          }

          closeTxs.push(transaction)
        }

        const signed = await wallet.signAllTransactions(closeTxs)

        await Promise.all(
          signed.map(async (signedTx) => {
            await sendSignedTransaction({
              signedTransaction: signedTx,
              connection,
              sendingMessage: 'Sending Transaction: Close Option',
              successMessage: 'Transaction Confirmed: Close Option',
            })
          }),
        )
      } catch (err) {
        pushErrorNotification(err)
      }
    },
    [
      underlyingAssetDestKey,
      market.uAssetMint,
      market.optionMarketKey,
      market.underlyingAssetPoolKey,
      market.writerTokenMintKey,
      endpoint.programId,
      writerTokenSourceKey,
      pubKey,
      connection,
      wallet,
      pushErrorNotification,
      sendSignedTransaction,
      splTokenAccountRentBalance,
    ],
  )

  return {
    closeOptionPostExpiration,
  }
}
