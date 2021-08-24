import { useCallback, useContext } from 'react'
import { PublicKey, Transaction } from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import {
  initializeAccountsForMarket,
  initializeMarketInstruction,
  Market,
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
) => Promise<OptionMarket[]>) => {
  const { pushErrorNotification } = useNotifications()
  const { wallet, pubKey } = useWallet()
  const { connection, endpoint, dexProgramId } = useConnection()
  const { setMarkets } = useContext(OptionsMarketsContext)
  const { sendTransaction, sendSignedTransaction } = useSendTransaction()

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
        const programId = new PublicKey(endpoint.programId)
        const results = await Promise.all(
          quoteAmountsPerContract.map(async (qAmount) => {
            // Create and send transaction for creating/initializing accounts needed
            // for option market
            const {
              transaction: createAccountsTx,
              signers,
              optionMintKey,
              writerTokenMintKey,
              quoteAssetPoolKey,
              underlyingAssetPoolKey,
            } = await initializeAccountsForMarket({
              connection,
              payerKey: pubKey,
              programId,
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
              programId,
              fundingAccountKey: pubKey,
              underlyingAssetMintKey,
              quoteAssetMintKey,
              optionMintKey,
              writerTokenMintKey,
              underlyingAssetPoolKey,
              quoteAssetPoolKey,
              underlyingAmountPerContract: amountPerContractU64,
              quoteAmountPerContract: quoteAmountPerContractU64,
              expirationUnixTimestamp: expiration,
            })

            const initializeTransaction = new Transaction()
            initializeTransaction.add(initializeMarketIx)

            // Sign and approve both create accunts and initialize txes
            const { blockhash } = await connection.getRecentBlockhash()
            createAccountsTx.recentBlockhash = blockhash
            createAccountsTx.feePayer = pubKey
            createAccountsTx.partialSign(...signers)
            initializeTransaction.feePayer = pubKey
            initializeTransaction.recentBlockhash = blockhash
            const [signedCreateTx, signedSettleTx] =
              await wallet.signAllTransactions([
                createAccountsTx,
                initializeTransaction,
              ])

            await sendSignedTransaction({
              signedTransaction: signedCreateTx,
              connection,
              sendingMessage: 'Processing: Create Market Accounts',
              successMessage: 'Confirmed: Create Market Accounts',
            })
            await sendSignedTransaction({
              signedTransaction: signedSettleTx,
              connection,
              sendingMessage: 'Processing: Initialize Market',
              successMessage: 'Confirmed: Initialize Market',
            })

            const [optionMarketKey] = await Market.getDerivedAddressFromParams({
              programId,
              underlyingAssetMintKey,
              quoteAssetMintKey,
              underlyingAmountPerContract: amountPerContractU64,
              quoteAmountPerContract: quoteAmountPerContractU64,
              expirationUnixTimestamp: expiration,
            })
            const strike = qAmount.div(amountPerContract)

            const marketData: OptionMarket = {
              key: `${expiration}-${uAssetSymbol}-${qAssetSymbol}-${amountPerContract.toString()}-${amountPerContract.toString()}/${qAmount.toString()}`,
              amountPerContract,
              quoteAmountPerContract: qAmount,
              size: `${amountPerContract.toNumber()}`,
              strike,
              strikePrice: strike.toString(),
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
              psyOptionsProgramId: programId.toString(),
              serumProgramId: dexProgramId.toString(),
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
        pushErrorNotification(err)
      }
      return []
    },
    [
      connection,
      endpoint.programId,
      pubKey,
      pushErrorNotification,
      setMarkets,
      wallet,
      dexProgramId,
      sendSignedTransaction,
    ],
  )
}
