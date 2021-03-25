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
  const { pushNotification } = useNotifications()
  const { pubKey, wallet } = useWallet()

  const closeOptionPostExpiration = useCallback(async () => {
    try {
      const { transaction } = await closePostExpirationOption({
        connection,
        payer: {
          publicKey: pubKey,
        },
        programId: endpoint.programId,
        optionMarketKey: new PublicKey(market.optionMarketDataAddress),
        underlyingAssetDestKey,
        writerTokenSourceKey,
        writerTokenSourceAuthorityKey: pubKey,
      })
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
  }, [connection, endpoint.programId, market.optionMarketDataAddress, pubKey, pushNotification, underlyingAssetDestKey, wallet, writerTokenSourceKey])

  return {
    closeOptionPostExpiration
  }
}
