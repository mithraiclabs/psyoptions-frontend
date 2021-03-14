import React, { useCallback } from 'react'
import { PublicKey } from '@solana/web3.js'
import { Link } from '@material-ui/core'
import { closePostExpirationOption } from '@mithraic-labs/options-js-bindings'
import useConnection from './useConnection'
import useWallet from './useWallet'
import useNotifications from './useNotifications'
import { buildSolanaExplorerUrl } from '../utils/solanaExplorer'

/**
 * Close the Option the wallet has written in order to return the
 * underlying asset to the option writer
 *
 * @param optionMint Mint for the option contract
 * @param optionMarketKey address for the option market data account
 * @param optionWriterUnderlyingAssetKey Underlying Asset account owned by the option writer
 * @param optionWriterQuotAssetKey Quote Asset account owned by the option writer
 * @param optionWriterOptionKey Option account owned by the option writer
 */
export const useCloseWrittenOptionPostExpiration = (
  optionMint,
  optionMarketKey,
  optionWriterUnderlyingAssetKey,
  optionWriterQuotAssetKey,
  optionWriterOptionKey,
  optionWriterRegistryKey,
) => {
  const { connection, endpoint } = useConnection()
  const { pushNotification } = useNotifications()
  const { pubKey, wallet } = useWallet()

  return useCallback(async () => {
    try {
      const { transaction } = await closePostExpirationOption(
        connection,
        {
          publicKey: pubKey,
        },
        endpoint.programId,
        optionWriterUnderlyingAssetKey,
        optionWriterQuotAssetKey,
        optionWriterOptionKey,
        new PublicKey(optionMint),
        new PublicKey(optionMarketKey),
        optionWriterRegistryKey,
      )
      const signed = await wallet.signTransaction(transaction)
      const txid = await connection.sendRawTransaction(signed.serialize())
      pushNotification({
        severity: 'info',
        message: `Submitted Transaction: Close Option`,
        link: (
          <Link href={buildSolanaExplorerUrl(txid)} target="_new">
            View on Solana Explorer
          </Link>
        ),
      })
      await connection.confirmTransaction(txid)
      pushNotification({
        severity: 'success',
        message: `Transaction Confirmed: Close Option`,
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
  }, [connection, endpoint.programId, optionMarketKey, optionMint, optionWriterOptionKey, optionWriterQuotAssetKey, optionWriterRegistryKey, optionWriterUnderlyingAssetKey, pubKey, pushNotification, wallet])
}
