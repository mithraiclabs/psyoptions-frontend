import { useContext, useCallback, useMemo } from 'react'
import BigNumber from 'bignumber.js'
import { Market } from '@mithraic-labs/psyoptions'
import { Connection, PublicKey } from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'

import useNotifications from './useNotifications'
import useWallet from './useWallet'
import useConnection from './useConnection'
import useAssetList from './useAssetList'
import useSendTransaction from './useSendTransaction'

import { OptionsMarketsContext } from '../context/OptionsMarketsContext'
import { useSolanaMeta } from '../context/SolanaMetaContext'

import { WRAPPED_SOL_ADDRESS } from '../utils/token'
import {
  createMissingMintAccounts,
  mintInstructions,
} from '../utils/instructions/index'

import { ClusterName, OptionMarket } from '../types'
import { getSupportedMarketsByNetwork } from '../utils/networkInfo'
import { findMarketByAssets } from '../utils/serum'

const useOptionsMarkets = () => {
  const { pushErrorNotification, pushNotification } = useNotifications()
  const { wallet, pubKey } = useWallet()
  const { connection, dexProgramId, endpoint } = useConnection()
  const { splTokenAccountRentBalance } = useSolanaMeta()
  const { sendTransaction } = useSendTransaction()
  const { markets, setMarkets, marketsLoading, setMarketsLoading } = useContext(
    OptionsMarketsContext,
  )
  const { supportedAssets } = useAssetList()

  /**
   * fetches PsyOptions market data individually. Should only be used for local development as
   * it makes chain requests inefficiently.
   */
  const fetchMarketData = useCallback(async () => {
    try {
      if (marketsLoading) return
      if (!(connection instanceof Connection)) return
      if (!endpoint.programId) return
      if (!supportedAssets || supportedAssets.length === 0) return

      setMarketsLoading(true)

      const assets = supportedAssets.map(
        (asset) => new PublicKey(asset.mintAddress),
      )
      const res = await Market.getAllMarketsBySplSupport(
        connection,
        new PublicKey(endpoint.programId),
        assets,
      )

      // Transform the market data to our expectations
      const newMarkets = {}
      await Promise.all(
        res.map(async (market) => {
          const uAssetMint = market.marketData.underlyingAssetMintKey
          const uAsset = supportedAssets.filter(
            (asset) => asset.mintAddress === uAssetMint.toString(),
          )[0]
          const qAssetMint = market.marketData.quoteAssetMintKey
          const qAsset = supportedAssets.filter(
            (asset) => asset.mintAddress === qAssetMint.toString(),
          )[0]

          // BN.js doesn't handle decimals while bignumber.js can handle decimals of arbitrary sizes
          // So convert all BN types to BigNumber
          const amountPerContract = new BigNumber(
            market.marketData.amountPerContract.toString(10),
          ).div(10 ** uAsset?.decimals)

          const quoteAmountPerContract = new BigNumber(
            market.marketData.quoteAmountPerContract.toString(10),
          ).div(10 ** qAsset?.decimals)

          const strike = quoteAmountPerContract.div(
            amountPerContract.toString(10),
          )

          const {
            expiration,
            optionMintKey,
            writerTokenMintKey,
            underlyingAssetPoolKey,
            underlyingAssetMintKey,
            quoteAssetPoolKey,
            quoteAssetMintKey,
            optionMarketKey,
          } = market.marketData

          const serumMarket = await findMarketByAssets(
            connection,
            optionMintKey,
            quoteAssetMintKey,
            dexProgramId,
          )
          // Short circuit if there is no serumMarket because OptionMarket must have a serumMarketKey
          if (!serumMarket) {
            return
          }

          const newMarket: OptionMarket = {
            key: `${expiration}-${uAsset.tokenSymbol}-${
              qAsset.tokenSymbol
            }-${amountPerContract.toString()}-${amountPerContract.toString()}/${quoteAmountPerContract.toString()}`,
            amountPerContract,
            quoteAmountPerContract,
            size: `${amountPerContract.toString(10)}`,
            uAssetSymbol: uAsset.tokenSymbol,
            qAssetSymbol: qAsset.tokenSymbol,
            uAssetMint: uAsset.mintAddress,
            qAssetMint: qAsset.mintAddress,
            strike,
            optionMarketKey,
            expiration,
            optionMintKey,
            writerTokenMintKey,
            underlyingAssetPoolKey,
            underlyingAssetMintKey,
            quoteAssetPoolKey,
            quoteAssetMintKey,
            serumMarketKey: serumMarket.address,
            psyOptionsProgramId: endpoint.programId,
            serumProgramId: dexProgramId.toString(),
          }

          const key = `${newMarket.expiration}-${newMarket.uAssetSymbol}-${
            newMarket.qAssetSymbol
          }-${newMarket.size}-${amountPerContract.toString(
            10,
          )}/${quoteAmountPerContract.toString(10)}`

          newMarkets[key] = newMarket
        }),
      )
      // Not sure if we should replace the existing markets or merge them
      setMarkets(newMarkets)
      setMarketsLoading(false)
      return
    } catch (err) {
      console.error(err)
      setMarketsLoading(false)
    }
  }, [connection, supportedAssets, endpoint]) // eslint-disable-line

  const packagedMarkets = useCallback(async () => {
    if (endpoint.name === ClusterName.localhost) {
      return fetchMarketData()
    }
    try {
      setMarketsLoading(true)
      const supportedMarkets = getSupportedMarketsByNetwork(endpoint.name)
      // Transform the market data to our expectations
      const newMarkets = {}
      supportedMarkets.forEach((market) => {
        const uAsset = supportedAssets.filter(
          (asset) => asset.mintAddress === market.underlyingAssetMint,
        )[0]

        const qAsset = supportedAssets.filter(
          (asset) => asset.mintAddress === market.quoteAssetMint,
        )[0]

        // BN.js doesn't handle decimals while bignumber.js can handle decimals of arbitrary sizes
        // So convert all BN types to BigNumber
        const amountPerContract = new BigNumber(
          market.underlyingAssetPerContract,
        ).div(10 ** uAsset?.decimals)

        const quoteAmountPerContract = new BigNumber(
          market.quoteAssetPerContract,
        ).div(10 ** qAsset?.decimals)

        const strike = quoteAmountPerContract.div(
          amountPerContract.toString(10),
        )

        const newMarket: OptionMarket = {
          key: `${market.expiration}-${uAsset.tokenSymbol}-${
            qAsset.tokenSymbol
          }-${amountPerContract.toString()}-${amountPerContract.toString()}/${quoteAmountPerContract.toString()}`,
          amountPerContract,
          quoteAmountPerContract,
          size: `${amountPerContract.toString(10)}`,
          uAssetSymbol: uAsset.tokenSymbol,
          qAssetSymbol: qAsset.tokenSymbol,
          uAssetMint: uAsset.mintAddress,
          qAssetMint: qAsset.mintAddress,
          strike,
          optionMarketKey: new PublicKey(market.optionMarketAddress),
          expiration: market.expiration,
          optionMintKey: new PublicKey(market.optionContractMintAddress),
          writerTokenMintKey: new PublicKey(
            market.optionWriterTokenMintAddress,
          ),
          underlyingAssetPoolKey: new PublicKey(
            market.underlyingAssetPoolAddress,
          ),
          underlyingAssetMintKey: new PublicKey(market.underlyingAssetMint),
          quoteAssetPoolKey: new PublicKey(market.quoteAssetPoolAddress),
          quoteAssetMintKey: new PublicKey(market.quoteAssetMint),
          serumMarketKey: new PublicKey(market.serumMarketAddress),
          psyOptionsProgramId: market.psyOptionsProgramId,
          serumProgramId: market.serumProgramId,
        }

        const key = `${newMarket.expiration}-${newMarket.uAssetSymbol}-${
          newMarket.qAssetSymbol
        }-${newMarket.size}-${amountPerContract.toString(
          10,
        )}/${quoteAmountPerContract.toString(10)}`

        newMarkets[key] = newMarket
      })
      // Not sure if we should replace the existing markets or merge them
      setMarkets(newMarkets)
      setMarketsLoading(false)
      return newMarkets
    } catch (err) {
      console.error(err)
      setMarketsLoading(false)
    }
    return {}
  }, [connection, fetchMarketData, supportedAssets, endpoint]) // eslint-disable-line

  const getSizes = useCallback(
    ({ uAssetSymbol, qAssetSymbol }) => {
      const keyPart = `-${uAssetSymbol}-${qAssetSymbol}-`

      const sizes = Object.keys(markets)
        .filter((key) => key.match(keyPart))
        .map((key) => markets[key].size)

      return [...new Set(sizes)]
    },
    [markets],
  )

  const getSizesWithDate = useCallback(
    ({ uAssetSymbol, qAssetSymbol, date }) => {
      const keyPart = `${date}-${uAssetSymbol}-${qAssetSymbol}-`

      const sizes = Object.keys(markets)
        .filter((key) => key.match(keyPart))
        .map((key) => markets[key].size)

      return [...new Set(sizes)]
    },
    [markets],
  )

  const getStrikePrices = ({ uAssetSymbol, qAssetSymbol, date, size }) => {
    const keyPart = `${date}-${uAssetSymbol}-${qAssetSymbol}-${size}-`
    return Object.keys(markets)
      .filter((key) => key.match(keyPart))
      .map((key) => markets[key].strikePrice)
  }

  const getDates = () => {
    const dates = Object.values(markets).map((m: OptionMarket) => m.expiration)
    const deduped = [...new Set(dates)]
    return deduped
  }

  const mint = async ({
    marketData,
    mintedOptionDestKey, // address in user's wallet to send minted Option Token to
    underlyingAssetSrcKey, // account in user's wallet to post uAsset collateral from
    writerTokenDestKey, // address in user's wallet to send the minted Writer Token
    existingTransaction: { transaction, signers }, // existing transaction and signers
    numberOfContracts,
  }) => {
    try {
      const tx = transaction

      const { transaction: mintTx } = await mintInstructions({
        numberOfContractsToMint: numberOfContracts,
        authorityPubkey: pubKey,
        programId: new PublicKey(marketData.psyOptionsProgramId),
        market: marketData,
        mintedOptionDestKey,
        writerTokenDestKey,
        underlyingAssetSrcKey,
      })

      tx.add(mintTx)
      // Close out the wrapped SOL account so it feels native
      if (marketData.uAssetMint === WRAPPED_SOL_ADDRESS) {
        tx.add(
          Token.createCloseAccountInstruction(
            TOKEN_PROGRAM_ID,
            underlyingAssetSrcKey,
            pubKey, // Send any remaining SOL to the owner
            pubKey,
            [],
          ),
        )
      }

      sendTransaction({
        transaction: tx,
        wallet,
        signers,
        connection,
        sendingMessage: 'Processing: Mint Options Token',
        successMessage: 'Confirmed: Mint Options Token',
      })

      return {
        optionTokenDestKey: mintedOptionDestKey,
        writerTokenDestKey,
      }
    } catch (err) {
      pushErrorNotification(err)
    }
    return {}
  }

  const createAccountsAndMint = async ({
    date,
    uAsset,
    qAsset,
    size,
    price,
    uAssetAccount,
    mintedOptionAccount,
    ownedMintedOptionAccounts,
    mintedWriterTokenDestKey,
    numberOfContracts,
  }) => {
    const uAssetSymbol = uAsset.tokenSymbol
    const qAssetSymbol = qAsset.tokenSymbol

    const marketData =
      markets[`${date}-${uAssetSymbol}-${qAssetSymbol}-${size}-${price}`]

    // Fallback to first oowned minted option account
    const mintedOptionDestAddress =
      mintedOptionAccount || ownedMintedOptionAccounts[0]

    const writerTokenDestAddress = mintedWriterTokenDestKey

    const { response, error } = await createMissingMintAccounts({
      owner: pubKey,
      market: marketData,
      uAsset,
      uAssetTokenAccount: uAssetAccount,
      splTokenAccountRentBalance,
      mintedOptionDestinationKey: mintedOptionDestAddress,
      writerTokenDestinationKey: writerTokenDestAddress,
      numberOfContractsToMint: numberOfContracts,
    })
    if (error) {
      pushNotification(error)
      return {}
    }
    const {
      transaction,
      signers,
      mintedOptionDestinationKey,
      writerTokenDestinationKey,
      uAssetTokenAccount,
    } = response

    return mint({
      marketData,
      mintedOptionDestKey: mintedOptionDestinationKey,
      underlyingAssetSrcKey: uAssetTokenAccount.pubKey,
      writerTokenDestKey: writerTokenDestinationKey,
      existingTransaction: { transaction, signers },
      numberOfContracts,
    })
  }

  return {
    markets,
    marketsLoading,
    setMarkets,
    setMarketsLoading,
    getStrikePrices,
    getSizes,
    getSizesWithDate,
    getDates,
    mint,
    createAccountsAndMint,
    fetchMarketData,
    packagedMarkets,
  }
}

export default useOptionsMarkets
