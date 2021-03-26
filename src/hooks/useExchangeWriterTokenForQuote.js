import React, { useCallback } from 'react';
import { exchangeWriterTokenForQuote } from '@mithraic-labs/options-js-bindings'
import { Link } from '@material-ui/core'
import useNotifications from './useNotifications';
import useConnection from './useConnection';
import useWallet from './useWallet';
import { buildSolanaExplorerUrl } from '../utils/solanaExplorer'

/**
 * Allow user to burn a Writer Token in exchange for Quote Asset in the 
 * Quote Asset Pool
 * 
 * @param {*} market 
 * @param {*} writerTokenSourceKey 
 * @param {*} quoteAssetDestKey 
 * @returns 
 */
export const useExchangeWriterTokenForQuote = (market, writerTokenSourceKey, quoteAssetDestKey) => {
  const { connection, endpoint } = useConnection()
  const { pubKey, wallet } = useWallet()
  const { pushNotification } = useNotifications()
  
  const _exchangeWriterTokenFoQuote = useCallback(async () => {
    try {
      const { transaction } = await exchangeWriterTokenForQuote({
        connection,
        payer: {
          publicKey: pubKey,
        },
        programId: endpoint.programId,
        optionMarketKey: market.optionMarketKey,
        optionMintKey: market.optionMintKey,
        writerTokenMintKey: market.writerTokenMintKey,
        writerTokenSourceAuthorityKey: pubKey,
        quoteAssetPoolKey: market.quoteAssetPoolKey,
        writerTokenSourceKey,
        quoteAssetDestKey,
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
  }, [connection, endpoint.programId, market.optionMarketKey, market.optionMintKey, market.quoteAssetPoolKey, market.writerTokenMintKey, pubKey, pushNotification, quoteAssetDestKey, wallet, writerTokenSourceKey])

  return {
    exchangeWriterTokenForQuote: _exchangeWriterTokenFoQuote
  }
}