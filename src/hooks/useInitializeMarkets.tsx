import React, { useCallback, useContext } from 'react'
import { Account, PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import Link from '@material-ui/core/Link'
import { initializeMarket } from '@mithraic-labs/psyoptions'
import useConnection from './useConnection'
import useNotifications from './useNotifications'
import useWallet from './useWallet'
import { buildSolanaExplorerUrl } from '../utils/solanaExplorer'
import { OptionsMarketsContext } from '../context/OptionsMarketsContext'

type InitMarketParams = {
  amountPerContract: BigNumber
  quoteAmountsPerContract: BigNumber[]
  uAssetSymbol: string
  qAssetSymbol: string
  uAssetMint: string
  qAssetMint: string
  expiration: number
  uAssetDecimals: number
  qAssetDecimals: number
}
export const useInitializeMarkets = (): ((
  obj: InitMarketParams,
  // TODO use right type
) => Promise<any[]>) => {
  const { pushNotification } = useNotifications()
  const { wallet, pubKey } = useWallet()
  const { connection, endpoint } = useConnection()
  const { setMarkets } = useContext(OptionsMarketsContext)

  return useCallback(
    async ({
      amountPerContract,
      quoteAmountsPerContract,
      uAssetSymbol,
      qAssetSymbol,
      uAssetMint,
      qAssetMint,
      expiration,
      uAssetDecimals,
      qAssetDecimals,
    }: InitMarketParams) => {
      try {
        const results = await Promise.all(
          quoteAmountsPerContract.map(async (qAmount) => {
            const {
              // signers,
              transaction,
              optionMarketDataAddress,
              optionMintAddress,
            } = await initializeMarket({
              connection,
              payer: { publicKey: pubKey } as Account,
              programId: endpoint.programId,
              underlyingAssetMintKey: new PublicKey(uAssetMint),
              quoteAssetMintKey: new PublicKey(qAssetMint),
              underlyingAssetDecimals: uAssetDecimals,
              quoteAssetDecimals: qAssetDecimals,
              underlyingAmountPerContract: amountPerContract,
              quoteAmountPerContract: qAmount,
              expirationUnixTimestamp: expiration,
            })

            const signed = await wallet.signTransaction(transaction)
            const txid = await connection.sendRawTransaction(signed.serialize())

            const explorerUrl = buildSolanaExplorerUrl(txid)

            pushNotification({
              severity: 'info',
              message: `Processing: Initialize Market`,
              link: (
                <Link href={explorerUrl} target="_new">
                  View on Solana Explorer
                </Link>
              ),
            })

            await connection.confirmTransaction(txid)

            pushNotification({
              severity: 'success',
              message: `Confirmed: Initialize Market`,
              link: (
                <Link href={explorerUrl} target="_new">
                  View on Solana Explorer
                </Link>
              ),
            })

            const marketData = {
              key: `${expiration}-${uAssetSymbol}-${qAssetSymbol}-${qAmount.toString()}-${amountPerContract.toString()}`,
              size: amountPerContract.toNumber(),
              strikePrice: qAmount.div(amountPerContract).toNumber(),
              uAssetSymbol,
              qAssetSymbol,
              uAssetMint,
              qAssetMint,
              expiration,
              optionMarketDataAddress: optionMarketDataAddress.toString(),
              optionMintAddress: optionMintAddress.toString(),
              createdByMe: true,
              amountPerContract,
              quoteAmountPerContract: qAmount,
            }

            return marketData
          }),
        )

        const newMarkets = {}
        // TODO use right type
        results.forEach((market: any) => {
          const m = market
          m.size = `${market.size}`
          m.strikePrice = `${market.strikePrice}`
          newMarkets[market.key] = m
          return m
        })
        setMarkets((markets) => ({ ...markets, ...newMarkets }))

        return results
      } catch (err) {
        console.error(err)
        pushNotification({
          severity: 'error',
          message: `${err}`,
        })
      }
      return []
    },
    [
      connection,
      endpoint.programId,
      pubKey,
      pushNotification,
      setMarkets,
      wallet,
    ],
  )
}
