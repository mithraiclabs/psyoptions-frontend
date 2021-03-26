import React, { useCallback } from 'react'
import { Link } from '@material-ui/core'
import { closePosition as closePositionTx } from '@mithraic-labs/options-js-bindings'
import useConnection from './useConnection'
import useWallet from './useWallet'
import useNotifications from './useNotifications'
import { buildSolanaExplorerUrl } from '../utils/solanaExplorer'

/**
 * Close the Option the wallet has written in order to return the
 * underlying asset to the option writer
 *
 * @param market Market for the option to be closed
 * @param optionTokenSrcKey PublicKey where the Option Token will be burned from
 * @param underlyingAssetDestKEy PublicKey where the unlocked underlying asset will be sent
 * @param writerTokenSourceKey PublicKey of the address where the Writer Token will be burned from
 */
export const useClosePosition = (
  market,
  optionTokenSrcKey,
  underlyingAssetDestKey,
  writerTokenSourceKey,
) => {
  const { connection, endpoint } = useConnection()
  const { pushNotification } = useNotifications()
  const { pubKey, wallet } = useWallet()

  const closePosition = useCallback(async () => {
    try {
      const { transaction } = await closePositionTx({
        connection,
        payer: {
          publicKey: pubKey,
        },
        programId: endpoint.programId,
        optionMarketKey: market.optionMarketKey,
        underlyingAssetPoolKey: market.underlyingAssetPoolKey,
        optionMintKey: market.optionMintKey,
        optionTokenSrcKey,
        optionTokenSrcAuthKey: pubKey,
        writerTokenMintKey: market.writerTokenMintKey,
        writerTokenSourceKey,
        writerTokenSourceAuthorityKey: pubKey,
        underlyingAssetDestKey,
      })
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
    connection,
    endpoint.programId,
    market.optionMarketKey,
    market.optionMintKey,
    market.underlyingAssetPoolKey,
    market.writerTokenMintKey,
    pubKey, pushNotification,
    underlyingAssetDestKey,
    wallet,
    optionTokenSrcKey,
    writerTokenSourceKey
  ])

  return {
    closePosition
  }
}
