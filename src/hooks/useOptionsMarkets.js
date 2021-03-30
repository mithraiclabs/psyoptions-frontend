import React, { useContext, useCallback } from 'react'
import BigNumber from 'bignumber.js'
import { Link } from '@material-ui/core'
import {
  initializeMarket,
  readMarketAndMintCoveredCall,
  Market,
} from '@mithraic-labs/options-js-bindings'

import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { buildSolanaExplorerUrl } from '../utils/solanaExplorer'
import useNotifications from './useNotifications'
import useWallet from './useWallet'
import useConnection from './useConnection'
import useAssetList from './useAssetList'

import { OptionsMarketsContext } from '../context/OptionsMarketsContext'

import { initializeTokenAccountTx, WRAPPED_SOL_ADDRESS } from '../utils/token'

import { truncatePublicKey } from '../utils/format'
import { useCreateNewTokenAccount } from './useCreateNewTokenAccount';

// Example of how markets data should look:
// const markets = {
//   '1614556800-SOL-USDC-700-14': {
//     createdByMe: true
//     expiration: 1614556800
//     key: "1614556800-SOL-USDC-700-14"
//     optionMarketDataAddress: "HtHcqroXGpRe5UATqYSAWenEgXK6wac3iMa8GWUaqA9j"
//     optionMintAddress: "8ovRGAZKbD6VD67h4BdnPY83iQohSeA4B1YZY5LwErFu"
//     qAssetMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
//     qAssetSymbol: "USDC"
//     size: 700
//     strikePrice: 14
//     uAssetMint: "So11111111111111111111111111111111111111112"
//     uAssetSymbol: "SOL"
//     writerRegistryAddress: PublicKey
//   },
// }

const useOptionsMarkets = () => {
  const { pushNotification } = useNotifications()
  const { wallet, pubKey } = useWallet()
  const { connection, endpoint } = useConnection()
  const { markets, setMarkets, marketsLoading, setMarketsLoading } = useContext(
    OptionsMarketsContext,
  )
  const { supportedAssets } = useAssetList()
  const createNewTokenAccount = useCreateNewTokenAccount()

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
      res.forEach((market) => {
        const uAssetMint = market.marketData.underlyingAssetMintKey
        const uAsset = supportedAssets.filter(
          (asset) => asset.mintAddress === uAssetMint.toString(),
        )[0]
        const qAssetMint = market.marketData.quoteAssetMintKey
        const qAsset = supportedAssets.filter(
          (asset) => asset.mintAddress === qAssetMint.toString(),
        )[0]

        // BN.js doesn't handle decimals while bignumber.js can handle decimals of arbitrary sizes
        const amountPerContract = new BigNumber(
          market.marketData.amountPerContract.toString(10),
        ).div(10 ** uAsset.decimals)

        const quoteAmountPerContract = new BigNumber(
          market.marketData.quoteAmountPerContract.toString(10),
        ).div(10 ** qAsset.decimals)

        const strike = quoteAmountPerContract.div(
          amountPerContract.toString(10),
        )

        // TODO clean up these values, not sure if everything is still used or the correct type
        const newMarket = {
          // Leave these in tact as BigNumbers to use later for creating the reciprocal put/call
          amountPerContract,
          quoteAmountPerContract,
          size: `${amountPerContract.toString(10)}`,
          expiration: market.marketData.expirationUnixTimestamp,
          uAssetSymbol: uAsset.tokenSymbol,
          qAssetSymbol: qAsset.tokenSymbol,
          uAssetMint: uAsset.mintAddress,
          qAssetMint: qAsset.mintAddress,
          strikePrice: `${strike.toString(10)}`,
          // optionMintAddress is deprecated and references should be removed
          optionMintAddress: market.marketData.optionMintKey.toString(),
          optionMintKey: market.marketData.optionMintKey,
          // optionMarketDataAddress is deprecated and references should be removed
          optionMarketDataAddress: market.pubkey.toString(),
          optionMarketKey: market.pubkey,
          writerTokenMintKey: market.marketData.writerTokenMintKey,
          underlyingAssetPoolKey: market.marketData.underlyingAssetPoolKey,
          quoteAssetPoolKey: market.marketData.quoteAssetPoolKey,
        }

        const key = `${newMarket.expiration}-${newMarket.uAssetSymbol}-${
          newMarket.qAssetSymbol
        }-${newMarket.size}-${strike.toString(10)}`
        newMarkets[key] = newMarket
      })
      // Not sure if we should replace the existing markets or merge them
      setMarkets(newMarkets)
      setMarketsLoading(false)
      return newMarkets //eslint-disable-line
    } catch (err) {
      console.error(err)
      setMarketsLoading(false)
    }
  }, [connection, supportedAssets, endpoint]) // eslint-disable-line

  const getSizes = ({ uAssetSymbol, qAssetSymbol, date }) => {
    const keyPart = `${date}-${uAssetSymbol}-${qAssetSymbol}-`

    const sizes = Object.keys(markets)
      .filter((key) => key.match(keyPart))
      .map((key) => markets[key].size)

    return [...new Set(sizes)]
  }

  const getStrikePrices = ({ uAssetSymbol, qAssetSymbol, date, size }) => {
    const keyPart = `${date}-${uAssetSymbol}-${qAssetSymbol}-${size}-`
    return Object.keys(markets)
      .filter((key) => key.match(keyPart))
      .map((key) => markets[key].strikePrice)
  }

  const getMarket = ({ uAssetSymbol, qAssetSymbol, date, size, price }) => {
    const key = `${date}-${uAssetSymbol}-${qAssetSymbol}-${size}-${price}`
    return markets[key]
  }

  const getDates = () => {
    const dates = Object.values(markets).map((m) => m.expiration)
    const deduped = [...new Set(dates)]
    return deduped
  }

  const initializeMarkets = async ({
    amountPerContract,
    quoteAmountsPerContract,
    uAssetSymbol,
    qAssetSymbol,
    uAssetMint,
    qAssetMint,
    expiration,
    uAssetDecimals,
    qAssetDecimals,
  }) => {
    const results = await Promise.all(
      quoteAmountsPerContract.map(async (qAmount) => {
        const {
          // signers,
          transaction,
          optionMarketDataAddress,
          optionMintAddress,
        } = await initializeMarket({
          connection,
          payer: { publicKey: pubKey },
          programId: endpoint.programId,
          underlyingAssetMintKey: uAssetMint,
          quoteAssetMintKey: qAssetMint,
          underlyingAssetDecimals: uAssetDecimals,
          quoteAssetDecimals: qAssetDecimals,
          underlyingAmountPerContract: amountPerContract,
          quoteAmountPerContract: qAmount,
          expirationUnixTimestamp: expiration,
        })

        const signed = await wallet.signTransaction(transaction)
        const txid = await connection.sendRawTransaction(signed.serialize())

        const explorerUrl = buildSolanaExplorerUrl(txid)

        // TODO: make the "View on Solana Explorer" am <a> element instead of text
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
    results.forEach((market) => {
      const m = market
      m.size = `${market.size}`
      m.strikePrice = `${market.strikePrice}`
      newMarkets[market.key] = m
      return m
    })
    setMarkets({ ...markets, ...newMarkets })

    return results
  }

  const getMyMarkets = () => Object.values(markets).filter((m) => m.createdByMe)

  const mint = async ({
    marketData,
    mintedOptionDestKey, // address in user's wallet to send minted Option Token to
    underlyingAssetSrcAccount, // account in user's wallet to post uAsset collateral from
    writerTokenDestKey, // address in user's wallet to send the minted Writer Token
  }) => {
    const transaction = new Transaction();
    // TODO check if the token is wrapped SOL before add this transfer
    transaction.add(Token.createTransferInstruction(TOKEN_PROGRAM_ID, pubKey, underlyingAssetSrcAccount, pubKey, [], marketData.amountPerContract))

    const { transaction: tx } = await readMarketAndMintCoveredCall({
      connection,
      payer: { publicKey: pubKey },
      programId: endpoint.programId,
      mintedOptionDestKey: new PublicKey(mintedOptionDestKey),
      writerTokenDestKey: new PublicKey(writerTokenDestKey),
      underlyingAssetSrcKey: new PublicKey(underlyingAssetSrcAccount),
      optionMarketKey: new PublicKey(marketData.optionMarketDataAddress),
      underlyingAssetAuthorityAccount: { publicKey: pubKey }, // Option writer's UA Authority account - safe to assume this is always the same as the payer when called from the FE UI
    })
    transaction.add(tx);

    const signed = await wallet.signTransaction(tx)
    const txid = await connection.sendRawTransaction(signed.serialize())

    pushNotification({
      severity: 'info',
      message: 'Processing: Mint Options Token',
      link: (
        <Link href={buildSolanaExplorerUrl(txid)} target="_new">
          View on Solana Explorer
        </Link>
      ),
    })

    await connection.confirmTransaction(txid)

    pushNotification({
      severity: 'success',
      message: 'Confirmed: Mint Options Token',
      link: (
        <Link href={buildSolanaExplorerUrl(txid)} target="_new">
          View on Solana Explorer
        </Link>
      ),
    })

    return txid
  }

  const createAccountsAndMint = async ({
    date,
    uAsset,
    qAsset,
    size,
    price,
    uAssetAccount,
    qAssetAccount,
    ownedUAssetAccounts,
    ownedQAssetAccounts,
    mintedOptionAccount,
    ownedMintedOptionAccounts,
    mintedWriterTokenDestKey,
  }) => {
    const uAssetSymbol = uAsset.tokenSymbol
    const qAssetSymbol = qAsset.tokenSymbol
    let _uAssetAccount = uAssetAccount;

    // if (!_uAssetAccount && uAsset.mintAddress === WRAPPED_SOL_ADDRESS) {
    //   // make an account for wrapped Sol when there is none
    //   // TODO this might be a bad idea without listening/polling to get newly created accounts.
    //   // If i don't refresh the page it will make a new account every time
    //   _uAssetAccount = await createNewTokenAccount(new PublicKey(WRAPPED_SOL_ADDRESS), 'Wrapped SOL')
    // }

    if (!_uAssetAccount && uAsset.mintAddress !== WRAPPED_SOL_ADDRESS) {
      // TODO - figure out how to distinguish between "a" vs "an" in this message
      // Not that simple because "USDC" you say "A", but for "ETH" you say an, it depends on the pronunciation
      pushNotification({
        severity: 'warning',
        message: `You must have one or more ${uAssetSymbol} accounts in your wallet to mint this contract`,
      })
      return true
    }

    // TODO - further optimization would be to remove the .find() here and just pass the whole object in
    const uAssetDecimals = new BigNumber(10).pow(uAsset.decimals)
    const uAssetBalance = new BigNumber(
      ownedUAssetAccounts.find((asset) => asset.pubKey === _uAssetAccount)
        ?.amount || 0,
    )

    const marketData = getMarket({
      date,
      uAssetSymbol,
      qAssetSymbol,
      size,
      price,
    })

    // Handle Wrapped SOL
    console.log('***** uAssetAccount', _uAssetAccount, marketData, marketData.amountPerContract.times(uAssetDecimals).toString());
    if (uAsset.mintAddress === WRAPPED_SOL_ADDRESS) {
      const lamports = marketData.amountPerContract.times(uAssetDecimals).toNumber()
      const [tx, newAccount] = await initializeTokenAccountTx({
        connection,
        payer: { publicKey: pubKey },
        mintPublicKey: new PublicKey(WRAPPED_SOL_ADDRESS),
        owner: pubKey,
        extraLamports: lamports,
      })
      const signed = await wallet.signTransaction(tx)
      const txid = await connection.sendRawTransaction(signed.serialize())
      pushNotification({
        severity: 'info',
        message: `Processing: Wrap ${size} Solana`,
        link: (
          <Link href={buildSolanaExplorerUrl(txid)} target="_new">
            View on Solana Explorer
          </Link>
        ),
      })

      await connection.confirmTransaction(txid)

      _uAssetAccount = newAccount.publicKey.toString();

      pushNotification({
        severity: 'success',
        message: `Confirmed: Wrap ${size} Solana`,
        link: (
          <Link href={buildSolanaExplorerUrl(txid)} target="_new">
            View on Solana Explorer
          </Link>
        ),
      })
    } 

    if (uAssetBalance.div(uAssetDecimals).isLessThan(size)) {
      pushNotification({
        severity: 'warning',
        message: `You must have at least ${size} ${uAssetSymbol} in your ${uAssetSymbol} account ${truncatePublicKey(
          _uAssetAccount,
        )} to mint this contract`,
      })
      return true
    }

    let quoteAssetDestAccount = qAssetAccount || ownedQAssetAccounts[0]
    // If user has no quote asset account, we can create one because they don't need any quote asset to mint
    if (!quoteAssetDestAccount) {
      quoteAssetDestAccount = await createNewTokenAccount(new PublicKey(marketData.qAssetMint), qAssetSymbol)
    }

    // Fallback to first oowned minted option account
    let mintedOptionDestKey =
      mintedOptionAccount || ownedMintedOptionAccounts[0]
    if (!mintedOptionDestKey) {
      // Create token account for minted option if the user doesn't have one yet
      mintedOptionDestKey = await createNewTokenAccount(new PublicKey(marketData.optionMintAddress), 'Options Token')
    }

    let writerTokenDestKey = mintedWriterTokenDestKey
    if (!writerTokenDestKey) {
      // Create token account for minted Writer Token if the user doesn't have one yet
      writerTokenDestKey = await createNewTokenAccount(marketData.writerTokenMintKey, 'Writer Token')
    }

    await mint({
      marketData,
      mintedOptionDestKey,
      underlyingAssetSrcAccount: _uAssetAccount,
      quoteAssetDestAccount,
      writerTokenDestKey,
    })

    // TODO delete wrapped sol account
  }

  return {
    initializeMarkets,
    markets,
    marketsLoading,
    setMarkets,
    setMarketsLoading,
    getMarket,
    getStrikePrices,
    getSizes,
    getDates,
    getMyMarkets,
    mint,
    createAccountsAndMint,
    fetchMarketData,
  }
}

export default useOptionsMarkets
