import {
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  Connection,
} from '@solana/web3.js'

import { DexInstructions, Market } from '@mithraic-labs/serum'
import BN from 'bn.js'
import { MintLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Buffer } from 'buffer'

import { MarketOptions, Orderbook } from '@mithraic-labs/serum/lib/market'
import * as Sentry from '@sentry/react'

export const getKeyForMarket = (market: Market) => {
  return market.address.toString()
}

/**
 * Loads multiple Serum markets with minimal RPC requests
 */
export const batchSerumMarkets = async (
  connection: Connection,
  addresses: PublicKey[],
  options: MarketOptions = {},
  programId: PublicKey,
  depth = 10,
) => {
  // Load all of the MarketState data
  const marketInfos = await connection.getMultipleAccountsInfo(addresses)
  if (!marketInfos || !marketInfos.length) {
    throw new Error('Markets not found')
  }
  // decode all of the markets
  const decoded = marketInfos.map((accountInfo) =>
    Market.getLayout(programId).decode(accountInfo.data),
  )

  // Load all of the SPL Token Mint data and orderbook data for the markets
  const mintKeys: PublicKey[] = []
  const orderbookKeys: PublicKey[] = []
  decoded.forEach((d) => {
    mintKeys.push(d.baseMint)
    mintKeys.push(d.quoteMint)
    orderbookKeys.push(d.bids)
    orderbookKeys.push(d.asks)
  })
  const [mintInfos, orderBookInfos] = await Promise.all([
    connection.getMultipleAccountsInfo(mintKeys),
    connection.getMultipleAccountsInfo(orderbookKeys),
  ])
  const mints = mintInfos?.map((mintInfo) => MintLayout.decode(mintInfo.data))

  // instantiate the many markets
  const serumMarketsInfo = decoded.map((d, index) => {
    const { decimals: baseMintDecimals } = mints?.[index * 2]
    const { decimals: quoteMintDecimals } = mints?.[index * 2 + 1]
    const bidsAccountInfo = orderBookInfos[index * 2]
    const asksAccountInfo = orderBookInfos[index * 2 + 1]
    const market = new Market(
      d,
      baseMintDecimals,
      quoteMintDecimals,
      options,
      programId,
    )
    const bidOrderbook = Orderbook.decode(market, bidsAccountInfo.data)
    const askOrderbook = Orderbook.decode(market, asksAccountInfo.data)
    return {
      market,
      orderbookData: {
        asks: askOrderbook
          .getL2(depth)
          .map(([price, size]) => ({ price, size })),
        bids: bidOrderbook
          .getL2(depth)
          .map(([price, size]) => ({ price, size })),
        bidOrderbook,
        askOrderbook,
      },
    }
  })

  return { serumMarketsInfo, orderbookKeys }
}

/**
 * Returns the first available SerumMarket for specified assets
 *
 * @param {Connect} connection
 * @param {PublicKey} baseMintAddress
 * @param {PublicKey} quoteMintAddress
 * @param {PublicKey} dexProgramKey
 */
export const findMarketByAssets = async (
  connection,
  baseMintAddress,
  quoteMintAddress,
  dexProgramKey,
) => {
  const availableMarkets = await Market.findAccountsByMints(
    connection,
    baseMintAddress,
    quoteMintAddress,
    dexProgramKey,
  )
  if (availableMarkets.length) {
    return Market.load(
      connection,
      availableMarkets[0].publicKey,
      {},
      dexProgramKey,
    )
  }
  return null
}

/**
 * Returns full orderbook up to specified depth
 * @param {number} depth
 * @param {number} roundTo -- TODO: merge orderbook rows by rounding the prices to a number of decimals
 * @returns {{ bids[[ price, size ]], asks[[ price, size ]]}}
 */
export const getOrderbook = async (
  connection: Connection,
  market: Market,
  depth = 20,
) => {
  try {
    const [bidOrderbook, askOrderbook] = await Promise.all([
      market.loadBids(connection),
      market.loadAsks(connection),
    ])

    return {
      bidOrderbook,
      askOrderbook,
      bids: !bidOrderbook
        ? []
        : bidOrderbook.getL2(depth).map(([price, size]) => ({ price, size })),
      asks: !askOrderbook
        ? []
        : askOrderbook.getL2(depth).map(([price, size]) => ({ price, size })),
    }
  } catch (err) {
    console.error(err)
    Sentry.captureException(err)
  }
  return {
    bidOrderbook: null,
    askOrderbook: null,
    bids: [],
    asks: [],
  }
}

/**
 * Generate the TX to initialize a new market.
 * pulled from https://github.com/project-serum/serum-dex-ui/blob/c6d0da0fc645492800f48a62b3314ebb5eaf2401/src/utils/send.tsx#L473
 *
 * @param {Connection} connection
 * @param {PublicKey} payer
 * @param {PublicKey} baseMint
 * @param {PublicKey} quoteMint
 * @param {BN} baseLotSize
 * @param {BN} quoteLotSize
 * @param {PublicKey} dexProgramId
 */
export const createInitializeMarketTx = async ({
  connection,
  payer,
  baseMint,
  quoteMint,
  baseLotSize,
  quoteLotSize,
  dexProgramId,
}) => {
  const tokenProgramId = TOKEN_PROGRAM_ID
  const market = new Keypair()
  const requestQueue = new Keypair()
  const eventQueue = new Keypair()
  const bids = new Keypair()
  const asks = new Keypair()
  const baseVault = new Keypair()
  const quoteVault = new Keypair()
  const feeRateBps = 0
  const quoteDustThreshold = new BN(100)

  async function getVaultOwnerAndNonce(): Promise<[PublicKey, BN]> {
    const nonce = new BN(0)
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const vaultOwner = await PublicKey.createProgramAddress(
          [market.publicKey.toBuffer(), nonce.toArrayLike(Buffer, 'le', 8)],
          dexProgramId,
        )
        return [vaultOwner, nonce]
      } catch (e) {
        nonce.iaddn(1)
      }
    }
  }
  const [vaultOwner, vaultSignerNonce] = await getVaultOwnerAndNonce()

  const tx1 = new Transaction()
  // Create an initialize the pool accounts to hold the base and the quote assess
  const poolSize = 165
  const poolCostLamports = await connection.getMinimumBalanceForRentExemption(
    poolSize,
  )

  tx1.add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: baseVault.publicKey,
      lamports: poolCostLamports,
      space: poolSize,
      programId: tokenProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: quoteVault.publicKey,
      lamports: poolCostLamports,
      space: poolSize,
      programId: tokenProgramId,
    }),
    Token.createInitAccountInstruction(
      tokenProgramId,
      baseMint,
      baseVault.publicKey,
      vaultOwner,
    ),
    Token.createInitAccountInstruction(
      tokenProgramId,
      quoteMint,
      quoteVault.publicKey,
      vaultOwner,
    ),
  )

  const tx2 = new Transaction()
  tx2.add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: market.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        Market.getLayout(dexProgramId).span,
      ),
      space: Market.getLayout(dexProgramId).span,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: requestQueue.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(5120 + 12),
      space: 5120 + 12,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: eventQueue.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(262144 + 12),
      space: 262144 + 12,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: bids.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(65536 + 12),
      space: 65536 + 12,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: asks.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(65536 + 12),
      space: 65536 + 12,
      programId: dexProgramId,
    }),
    DexInstructions.initializeMarket({
      market: market.publicKey,
      requestQueue: requestQueue.publicKey,
      eventQueue: eventQueue.publicKey,
      bids: bids.publicKey,
      asks: asks.publicKey,
      baseVault: baseVault.publicKey,
      quoteVault: quoteVault.publicKey,
      baseMint,
      quoteMint,
      baseLotSize,
      quoteLotSize,
      feeRateBps,
      vaultSignerNonce,
      quoteDustThreshold,
      programId: dexProgramId,
    }),
  )

  const { blockhash } = await connection.getRecentBlockhash()
  const signers1 = [payer, baseVault, quoteVault]
  tx1.feePayer = payer
  tx1.recentBlockhash = blockhash
  tx1.partialSign(...signers1.slice(1))
  const signers2 = [payer, market, requestQueue, eventQueue, bids, asks]
  tx2.feePayer = payer
  tx2.recentBlockhash = blockhash
  tx2.partialSign(...signers2.slice(1))
  return {
    tx1,
    signers1,
    tx2,
    signers2,
    market,
  }
}

export class SerumMarket {
  connection: Connection

  marketAddress: PublicKey

  dexProgramKey: PublicKey

  market?: Market

  constructor(
    connection: Connection,
    marketAddress: PublicKey,
    dexProgramKey: PublicKey,
    market?: Market,
  ) {
    this.connection = connection
    this.marketAddress = marketAddress
    this.dexProgramKey = dexProgramKey
    this.market = market
  }

  async initMarket() {
    this.market = await this.getMarket()
  }

  /**
   * Look up a Serum market via the Base and Quote mint addresses.
   * @param {PublicKey} baseMintAddress
   * @param {PublicKey} quoteMintAddress
   * @param {PublicKey} dexProgramId
   */
  static async getMarketByAssetKeys(
    connection,
    baseMintAddress,
    quoteMintAddress,
    dexProgramId,
  ) {
    const filters = [
      {
        memcmp: {
          offset: Market.getLayout(dexProgramId).offsetOf('baseMint'),
          bytes: baseMintAddress.toBase58(),
        },
      },
      {
        memcmp: {
          offset: Market.getLayout(dexProgramId).offsetOf('quoteMint'),
          bytes: quoteMintAddress.toBase58(),
        },
      },
    ]
    const resp = await connection._rpcRequest('getProgramAccounts', [
      dexProgramId.toBase58(),
      {
        commitment: connection.commitment,
        filters,
        encoding: 'base64',
      },
    ])
    if (resp.error) {
      throw new Error(resp.error.message)
    }
    return resp.result.map(
      ({ pubkey, account: { data, executable, owner, lamports } }) => ({
        publicKey: new PublicKey(pubkey),
        accountInfo: {
          data: Buffer.from(data[0], 'base64'),
          executable,
          owner: new PublicKey(owner),
          lamports,
        },
      }),
    )
  }

  /**
   *
   * @param {Connection} connection
   * @param {PublicKey} marketAddress
   */
  async getMarket() {
    return Market.load(
      this.connection,
      this.marketAddress,
      {},
      this.dexProgramKey,
    )
  }

  /**
   * Returns the highest bid price and lowest ask price for a market
   */
  async getBidAskSpread() {
    if (!this.market) {
      return { bid: null, ask: null }
    }
    const bidOrderbook = await this.market.loadBids(this.connection)
    const askOrderbook = await this.market.loadAsks(this.connection)

    const highestbid = bidOrderbook.getL2(1)[0]
    const lowestAsk = askOrderbook.getL2(1)[0]
    return { bid: highestbid[0], ask: lowestAsk[0] }
  }
}
