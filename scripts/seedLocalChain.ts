/**
 * TODO Create 4 CALL and 4 PUT markets for the Friday ending this month
 * TODO Initialize Serum markets for them
 */

import {
  initializeAccountsForMarket,
  initializeMarketInstruction,
  Market,
} from '@mithraic-labs/psyoptions'
import {
  Account,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import * as fs from 'fs'
import moment from 'moment'

import { getSolanaConfig } from './helpers'
import { getLastFridayOfMonths } from '../src/utils/dates'
import { getAssetsByNetwork } from '../src/utils/networkInfo'
import { ClusterName } from '../src/types'

// TODO clean up with yargs
if (!process.argv[2]) {
  throw new Error('Must specify the PsyOptions programId as an argument')
}
const programKeypair = new Account(
  JSON.parse(fs.readFileSync(process.argv[2]) as unknown as string),
)
const programId = programKeypair.publicKey
console.log('*** programId', programId)

const solanaConfig = getSolanaConfig()
// Get the default keypair and airdrop some tokens
const keyBuffer = fs.readFileSync(solanaConfig.keypair_path) as unknown
const wallet = new Account(JSON.parse(keyBuffer as string))
const connection = new Connection('http://localhost:8899', {
  commitment: 'confirmed',
})

const initializeMarket = async (
  /** the keypair of the wallet creating the market */
  wallet: Account,
  /** The full underlying amount per contract **including the quote asset decimal places** */
  underlyingAmountPerContract: BigNumber,
  /** The full quoteAmountPerContract **including the quote asset decimal places** */
  quoteAmountPerContract: BigNumber,
  /** The public key for the underlying asset mint */
  underlyingAssetMintKey: PublicKey,
  /** The public key for the quote asset mint */
  quoteAssetMintKey: PublicKey,
  /* The unix time stamp for the contract expiration **in seconds** */
  expirationUnixTimestamp: number,
) => {
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
    payerKey: wallet.publicKey,
    programId,
  })
  console.log('*** sending initializeAccountsForMarket TX')

  await connection.sendTransaction(createAccountsTx, [wallet, ...signers])

  // create and send transaction for initializing the option market
  const initializeMarketIx = await initializeMarketInstruction({
    programId,
    fundingAccountKey: wallet.publicKey,
    underlyingAssetMintKey,
    quoteAssetMintKey,
    optionMintKey,
    writerTokenMintKey,
    underlyingAssetPoolKey,
    quoteAssetPoolKey,
    underlyingAmountPerContract: underlyingAmountPerContract.toNumber(),
    quoteAmountPerContract: quoteAmountPerContract.toNumber(),
    expirationUnixTimestamp,
  })
  const transaction = new Transaction()
  transaction.add(initializeMarketIx)
  await connection.sendTransaction(transaction, [wallet], {
    skipPreflight: false,
    preflightCommitment: 'recent',
  })
  const [optionMarketKey] = await Market.getDerivedAddressFromParams({
    programId,
    underlyingAssetMintKey,
    quoteAssetMintKey,
    underlyingAmountPerContract: underlyingAmountPerContract.toNumber(),
    quoteAmountPerContract: quoteAmountPerContract.toNumber(),
    expirationUnixTimestamp,
  })
  return optionMarketKey
}

;(async () => {
  // create markets for the end of the current month
  const expirationDate = getLastFridayOfMonths(1)[0]
  // We have to divide the JS timestamp by 1,000 to get the timestamp in miliseconds
  const expirationUnixTimestamp = expirationDate.unix()
  const assets = getAssetsByNetwork(ClusterName.localhost)
  const btc = assets.find((asset) => asset.tokenSymbol.match('BTC'))
  const usdc = assets.find((asset) => asset.tokenSymbol.match('USDC'))
  const btcKey = new PublicKey(btc.mintAddress)
  const usdcKey = new PublicKey(usdc.mintAddress)
  const wholeBtcPerContract = 0.05
  const underlyingAmountPerContract = new BigNumber(
    wholeBtcPerContract,
  ).multipliedBy(new BigNumber(10).pow(btc.decimals))
  const quoteAssetPerContract = new BigNumber(
    35_000 * wholeBtcPerContract,
  ).multipliedBy(new BigNumber(10).pow(usdc.decimals))

  console.log(
    '*** initializing market with params',
    underlyingAmountPerContract.toString(),
    quoteAssetPerContract.toString(),
    btcKey.toString(),
    usdcKey.toString(),
    expirationUnixTimestamp,
  )
  await initializeMarket(
    wallet,
    underlyingAmountPerContract,
    quoteAssetPerContract,
    btcKey,
    usdcKey,
    expirationUnixTimestamp,
  )
})()
