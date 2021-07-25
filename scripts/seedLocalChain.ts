/**
 * TODO Create 4 CALL and 4 PUT markets for the Friday ending this month
 * TODO Initialize Serum markets for them
 */

import dotenv from 'dotenv'
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
  sendAndConfirmTransaction,
  Transaction,
} from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import * as fs from 'fs'
import moment from 'moment'

import { getSolanaConfig } from './helpers'
import { getLastFridayOfMonths } from '../src/utils/dates'
import { getAssetsByNetwork } from '../src/utils/networkInfo'
import { ClusterName } from '../src/types'
import BN from 'bn.js'
import { createInitializeMarketTx } from '../src/utils/serum'
dotenv.config()

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
  commitment: 'max',
})

const dexProgramId = new PublicKey(process.env.LOCAL_DEX_PROGRAM_ID)

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
  console.log('*** sending createAccountsTx TX', new Date().toISOString())

  await sendAndConfirmTransaction(
    connection,
    createAccountsTx,
    [wallet, ...signers],
    {
      commitment: 'confirmed',
    },
  )

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
  console.log('** sending initialize market TX', new Date().toISOString())
  await sendAndConfirmTransaction(connection, transaction, [wallet], {
    commitment: 'confirmed',
  })
  const [optionMarketKey] = await Market.getDerivedAddressFromParams({
    programId,
    underlyingAssetMintKey,
    quoteAssetMintKey,
    underlyingAmountPerContract: underlyingAmountPerContract.toNumber(),
    quoteAmountPerContract: quoteAmountPerContract.toNumber(),
    expirationUnixTimestamp,
  })
  return { optionMarketKey, optionMintKey }
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
  const wholeBtcPerContract = 0.1
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
  const { optionMarketKey, optionMintKey } = await initializeMarket(
    wallet,
    underlyingAmountPerContract,
    quoteAssetPerContract,
    btcKey,
    usdcKey,
    expirationUnixTimestamp,
  )

  // This will likely be USDC or USDT but could be other things in some cases
  const quoteLotSize = new BN(0.01 * 10 ** usdc.decimals)
  // baseLotSize should be 1 -- the options market token doesn't have decimals
  const baseLotSize = new BN('1')
  console.log('*** intializing serum market', new Date().toISOString())
  const { tx1, tx2, signers1, signers2, market } =
    await createInitializeMarketTx({
      connection,
      payer: wallet.publicKey,
      baseMint: optionMintKey,
      quoteMint: usdcKey,
      baseLotSize,
      quoteLotSize,
      dexProgramId,
    })

  await sendAndConfirmTransaction(connection, tx1, [wallet, ...signers1], {
    commitment: 'confirmed',
  })

  await sendAndConfirmTransaction(connection, tx2, [wallet, ...signers2], {
    commitment: 'confirmed',
  })
})()
