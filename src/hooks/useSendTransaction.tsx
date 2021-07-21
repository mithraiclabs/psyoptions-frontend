import React, { useCallback } from 'react'
import {
  Connection,
  Keypair,
  SimulatedTransactionResponse,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js'
import Wallet from '@project-serum/sol-wallet-adapter'
import Link from '@material-ui/core/Link'
import {
  awaitTransactionSignatureConfirmation,
  getUnixTs,
  signTransaction,
  simulateTransaction,
  sleep,
} from '../utils/send'
import useNotifications from './useNotifications'
import { NotificationSeverity } from '../types'
import { buildSolanaExplorerUrl } from '../utils/solanaExplorer'
import TransactionError from '../utils/transactionErrors/TransactionError'

const DEFAULT_TIMEOUT = 30000

/**
 * Send transactions and use push notifications for info, confirmation, and errors
 */
const useSendTransaction = () => {
  const { pushNotification } = useNotifications()
  const sendSignedTransaction = useCallback(
    async ({
      signedTransaction,
      connection,
      sendingMessage = 'Sending transaction...',
      successMessage = 'Transaction confirmed',
      timeout = DEFAULT_TIMEOUT,
    }: {
      signedTransaction: Transaction
      connection: Connection
      sendingMessage?: string
      successMessage?: string
      timeout?: number
    }): Promise<string> => {
      const rawTransaction = signedTransaction.serialize()
      const startTime = getUnixTs()

      const txid: TransactionSignature = await connection.sendRawTransaction(
        rawTransaction,
        {
          skipPreflight: true,
        },
      )

      const explorerUrl = buildSolanaExplorerUrl(txid)

      pushNotification({
        severity: NotificationSeverity.INFO,
        message: sendingMessage,
        link: (
          <Link href={explorerUrl} target="_new">
            View on Solana Explorer
          </Link>
        ),
        txid,
      })

      let done = false
      ;(async () => {
        while (!done && getUnixTs() - startTime < timeout) {
          connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
          })
          await sleep(300)
        }
      })()
      try {
        await awaitTransactionSignatureConfirmation(txid, timeout, connection)
      } catch (err) {
        if (err.timeout) {
          throw new Error('Timed out awaiting confirmation on transaction')
        }
        let simulateResult: SimulatedTransactionResponse | null = null
        try {
          simulateResult = (
            await simulateTransaction(connection, signedTransaction, 'single')
          ).value
        } catch (e) {
          console.error('Error: ', e)
        }

        if (simulateResult && simulateResult.err) {
          if (simulateResult.logs) {
            for (let i = simulateResult.logs.length - 1; i >= 0; i -= 1) {
              const line = simulateResult.logs[i]
              if (line.startsWith('Program log: ')) {
                throw new TransactionError(
                  `Transaction failed: ${line.slice('Program log: '.length)}`,
                  signedTransaction,
                  txid,
                )
              }
            }
          }
          throw new TransactionError(
            JSON.stringify(simulateResult.err),
            signedTransaction,
            txid,
          )
        }
        throw new TransactionError(
          'Transaction failed',
          signedTransaction,
          txid,
        )
      } finally {
        done = true
      }

      pushNotification({
        severity: NotificationSeverity.SUCCESS,
        message: successMessage,
        link: (
          <Link href={explorerUrl} target="_new">
            View on Solana Explorer
          </Link>
        ),
        txid,
      })

      console.log('Latency', txid, getUnixTs() - startTime)
      return txid
    },
    [pushNotification],
  )

  const sendTransaction = useCallback(
    async ({
      transaction,
      wallet,
      signers = [],
      connection,
      sendingMessage = 'Sending transaction...',
      successMessage = 'Transaction confirmed',
      timeout = DEFAULT_TIMEOUT,
    }: {
      transaction: Transaction
      wallet: Wallet
      signers?: Array<Keypair>
      connection: Connection
      sendingMessage?: string
      successMessage?: string
      timeout?: number
    }) => {
      const signedTransaction = await signTransaction({
        transaction,
        wallet,
        signers,
        connection,
      })
      return sendSignedTransaction({
        signedTransaction,
        connection,
        sendingMessage,
        successMessage,
        timeout,
      })
    },
    [sendSignedTransaction],
  )
  return { sendTransaction, sendSignedTransaction }
}

export default useSendTransaction
