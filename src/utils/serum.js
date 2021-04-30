import { Account, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'

import { DexInstructions, Market } from '@mithraic-labs/serum'
import BN from 'bn.js'
import { Token } from '@solana/spl-token'
import { Buffer } from 'buffer'

import { TOKEN_PROGRAM_ID } from './tokenInstructions'

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
  const market = new Account()
  const requestQueue = new Account()
  const eventQueue = new Account()
  const bids = new Account()
  const asks = new Account()
  const baseVault = new Account()
  const quoteVault = new Account()
  const feeRateBps = 0
  const quoteDustThreshold = new BN(100)

  async function getVaultOwnerAndNonce() {
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
  /**
   *
   * @param {Connection} connection
   * @param {PublicKey} marketAddress
   * @param {PublicKey} dexProgramKey
   */
  constructor(connection, marketAddress, dexProgramKey) {
    this.connection = connection
    this.marketAddress = marketAddress
    this.dexProgramKey = dexProgramKey
  }

  async initMarket() {
    this.market = await this.getMarket()
  }

  /**
   * Returns the first available SerumMarket for specified assets
   *
   * @param {Connect} connection
   * @param {PublicKey} baseMintAddress
   * @param {PublicKey} quoteMintAddress
   * @param {PublicKey} dexProgramKey
   */
  static async findByAssets(
    connection,
    baseMintAddress,
    quoteMintAddress,
    dexProgramKey,
  ) {
    const availableMarkets = await SerumMarket.getMarketByAssetKeys(
      connection,
      baseMintAddress,
      quoteMintAddress,
      dexProgramKey,
    )
    if (availableMarkets.length) {
      const market = new SerumMarket(
        connection,
        availableMarkets[0].publicKey,
        dexProgramKey,
      )
      await market.initMarket()
      return market
    }
    return null
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

  /**
   * Returns full orderbook up to specified depth
   * @param {number} depth
   * @param {number} roundTo -- TODO: merge orderbook rows by rounding the prices to a number of decimals
   * @returns {{ bids[[ price, size ]], asks[[ price, size ]]}}
   */
  async getOrderbook(depth = 20) {
    try {
      const [bidOrderbook, askOrderbook] = await Promise.all([
        this.market.loadBids(this.connection),
        this.market.loadAsks(this.connection),
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
      return {
        bidOrderbook: null,
        askOrderbook: null,
        bids: [],
        asks: [],
      }
    }
  }

  async getPrice() {
    const { bid, ask } = await this.getBidAskSpread()
    return (ask - bid) / 2 + bid
  }

  /**
   * @typedef PlaceOrderOptions
   * @property {BN} clientId - (not 100% sure) The ID to collect commissions from serum
   * @property {PublicKey | undefined} openOrdersAddressKey - This account stores the following:
   *   How much of the base and quote currency that user has locked in open orders or settleableA
   *   list of open orders for that user on that market.
   *   This is an option because the Market#makePlaceOrderTransaction function will look up
   *   OpenOrder accounts by owner.
   * @property {Account | undefined} openOrdersAccount - See above as well
   * @property {PublicKey | undefined} feeDiscountPubkey -
   */

  /**
   *
   * @param {PublicKey} owner - the wallet's PublicKey
   * @param {PublicKey} payer - The account that will be putting up the asset. If the order side
   * is 'sell', this must be an account holding the Base currency. If the order side is 'buy',
   * this must be an account holding the Quote currency.
   * @param {'buy'|'sell'} side - buying or selling the asset
   * @param {number} price - price of asset relative to quote asset
   * @param {number} size - amount of asset
   * @param {'limit' | 'ioc' | 'postOnly' | undefined} orderType - type of order
   * @param {PlaceOrderOptions} opts
   * @return {{
   *  transaction: placeOrderTx,
   *  signers: placeOrderSigners
   * }}
   */
  async createPlaceOrderTx({
    connection,
    owner,
    payer,
    side,
    price,
    size,
    orderType,
    opts = {},
  }) {
    const {
      clientId,
      openOrdersAddressKey,
      openOrdersAccount,
      feeDiscountPubkey,
    } = opts

    return this.market.makePlaceOrderTransaction(connection, {
      owner,
      payer,
      side,
      price,
      size,
      orderType,
      clientId,
      openOrdersAddressKey,
      openOrdersAccount,
      feeDiscountPubkey,
    })
  }
}
