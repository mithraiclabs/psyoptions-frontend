/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useCallback, useContext } from 'react'
import { Account, Keypair, PublicKey, Transaction } from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import {
  initializeAccountsForMarket,
  initializeMarketInstruction,
} from '@mithraic-labs/psyoptions'
import useConnection from './useConnection'
import useNotifications from './useNotifications'
import useWallet from './useWallet'
import { OptionsMarketsContext } from '../context/OptionsMarketsContext'
import useSendTransaction from './useSendTransaction'

import { OptionMarket } from '../types'

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
  const sendTransaction = useSendTransaction()

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
            // Create and send transaction for creating/initializing accounts needed
            // for option market
            const {
              transaction: createAccountsTx,
              signers,
              optionMarketKey,
              optionMintKey,
              writerTokenMintKey,
              quoteAssetPoolKey,
              underlyingAssetPoolKey,
            } = await initializeAccountsForMarket({
              connection,
              payer: { publicKey: pubKey } as Account,
              programId: endpoint.programId,
            })
            await sendTransaction({
              transaction: createAccountsTx,
              wallet,
              // @ts-ignore: need to transition psyoptions-ts to use Keypair instead of account for this to go away
              signers,
              connection,
              sendingMessage: 'Processing: Create Market Accounts',
              successMessage: 'Confirmed: Create Market Accounts',
            })

            // TODO -- can we encode these to the buffer without converting back to the built-in number type?
            const amountPerContractU64 = amountPerContract
              .multipliedBy(new BigNumber(10).pow(uAssetDecimals))
              .toNumber()
            const quoteAmountPerContractU64 = qAmount
              .multipliedBy(new BigNumber(10).pow(qAssetDecimals))
              .toNumber()

            const underlyingAssetMintKey = new PublicKey(uAssetMint)
            const quoteAssetMintKey = new PublicKey(qAssetMint)

            // create and send transaction for initializing the option market
            const initializeMarketIx = await initializeMarketInstruction({
              programId: new PublicKey(endpoint.programId),
              fundingAccountKey: pubKey,
              underlyingAssetMintKey,
              quoteAssetMintKey,
              optionMintKey,
              writerTokenMintKey,
              optionMarketKey,
              underlyingAssetPoolKey,
              quoteAssetPoolKey,
              underlyingAmountPerContract: amountPerContractU64,
              quoteAmountPerContract: quoteAmountPerContractU64,
              expirationUnixTimestamp: expiration,
            })

            const transaction = new Transaction()
            transaction.add(initializeMarketIx)
            await sendTransaction({
              transaction,
              wallet,
              signers: [],
              connection,
              sendingMessage: 'Processing: Initialize Market',
              successMessage: 'Confirmed: Initialize Market',
            })

            const marketData: OptionMarket = {
              key: `${expiration}-${uAssetSymbol}-${qAssetSymbol}-${amountPerContract.toString()}-${amountPerContract.toString()}/${qAmount.toString()}`,
              amountPerContract,
              quoteAmountPerContract: qAmount,
              size: `${amountPerContract.toNumber()}`,
              strikePrice: `${qAmount.div(amountPerContract).toNumber()}`,
              uAssetSymbol,
              qAssetSymbol,
              uAssetMint,
              qAssetMint,
              expiration,
              optionMarketKey,
              optionMintKey,
              writerTokenMintKey,
              underlyingAssetPoolKey,
              underlyingAssetMintKey,
              quoteAssetPoolKey,
              quoteAssetMintKey,
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
      sendTransaction,
      wallet,
    ],
  )
}
