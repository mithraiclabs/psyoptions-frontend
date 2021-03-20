import {
  Account,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from '@solana/web3.js'

import { DexInstructions, Market, OpenOrders } from '@project-serum/serum'
import BN from 'bn.js'
import { Token } from '@solana/spl-token'
import { Buffer } from 'buffer'

import { TOKEN_PROGRAM_ID } from './tokenInstructions'

const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112')

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
  async createPlaceOrderTx(
    owner,
    payer,
    side,
    price,
    size,
    orderType,
    opts = {},
  ) {
    const params = {
      owner,
      payer,
      side,
      price,
      size,
      orderType,
      feeDiscountPubkey: opts.feeDiscountPubkey || null,
    }
    return this.market.makePlaceOrderTransaction(
      this.connection,
      params,
      120_000,
      120_000,
    )
  }

  async placeOrder(
    connection,
    {
      owner,
      payer,
      side,
      price,
      size,
      orderType = 'limit',
      clientId,
      openOrdersAddressKey,
      openOrdersAccount,
      feeDiscountPubkey,
    },
  ) {
    const { transaction, signers } = await this.makePlaceOrderTransaction(
      connection,
      {
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
      },
    )

    await sendAndConfirmTransaction(
      connection,
      transaction,
      [owner, ...signers],
      {
        skipPreflight: false,
        commitment: 'max',
        preflightCommitment: 'recent',
      },
    )
    // return this.market._sendTransaction(connection, transaction, [
    //   owner,
    //   ...signers,
    // ]);
  }

  async makePlaceOrderTransaction(
    connection,
    {
      owner,
      payer,
      side,
      price,
      size,
      orderType = 'limit',
      clientId,
      openOrdersAddressKey,
      openOrdersAccount,
    },
    cacheDurationMs = 0,
  ) {
    // @ts-ignore
    const ownerAddress = owner.publicKey ?? owner
    const openOrdersAccounts = await this.market.findOpenOrdersAccountsForOwner(
      connection,
      ownerAddress,
      cacheDurationMs,
    )
    const transaction = new Transaction()
    const signers = []

    // Fetch an SRM fee discount key if the market supports discounts and it is not supplied
    // let useFeeDiscountPubkey;
    // if (feeDiscountPubkey) {
    //   useFeeDiscountPubkey = feeDiscountPubkey;
    // } else if (
    //   feeDiscountPubkey === undefined &&
    //   this.market.supportsSrmFeeDiscounts
    // ) {
    //   useFeeDiscountPubkey = (
    //     await this.findBestFeeDiscountKey(
    //       connection,
    //       ownerAddress,
    //       feeDiscountPubkeyCacheDurationMs,
    //     )
    //   ).pubkey;
    // } else {
    const useFeeDiscountPubkey = null
    // }

    let openOrdersAddress
    if (openOrdersAccounts.length === 0) {
      let account
      if (openOrdersAccount) {
        account = openOrdersAccount
      } else {
        account = new Account()
      }
      transaction.add(
        await OpenOrders.makeCreateAccountTransaction(
          connection,
          this.market.address,
          ownerAddress,
          account.publicKey,
          this.market._programId,
        ),
      )
      openOrdersAddress = account.publicKey
      signers.push(account)
      // refresh the cache of open order accounts on next fetch
      this.market._openOrdersAccountsCache[ownerAddress.toBase58()].ts = 0
    } else if (openOrdersAccount) {
      openOrdersAddress = openOrdersAccount.publicKey
    } else if (openOrdersAddressKey) {
      openOrdersAddress = openOrdersAddressKey
    } else {
      openOrdersAddress = openOrdersAccounts[0].address
    }

    let wrappedSolAccount = null
    if (payer.equals(ownerAddress)) {
      if (
        (side === 'buy' && this.market.quoteMintAddress.equals(SOL_MINT)) ||
        (side === 'sell' && this.market.baseMintAddress.equals(SOL_MINT))
      ) {
        wrappedSolAccount = new Account()
        let lamports
        if (side === 'buy') {
          lamports = Math.round(price * size * 1.01 * LAMPORTS_PER_SOL)
          if (openOrdersAccounts.length > 0) {
            lamports -= openOrdersAccounts[0].quoteTokenFree.toNumber()
          }
        } else {
          lamports = Math.round(size * LAMPORTS_PER_SOL)
          if (openOrdersAccounts.length > 0) {
            lamports -= openOrdersAccounts[0].baseTokenFree.toNumber()
          }
        }
        lamports = Math.max(lamports, 0) + 1e7
        transaction.add(
          SystemProgram.createAccount({
            fromPubkey: ownerAddress,
            newAccountPubkey: wrappedSolAccount.publicKey,
            lamports,
            space: 165,
            programId: TOKEN_PROGRAM_ID,
          }),
        )
        transaction.add(
          Token.createInitAccountInstruction(
            TOKEN_PROGRAM_ID,
            SOL_MINT,
            wrappedSolAccount.publicKey,
            ownerAddress,
          ),
        )
        signers.push(wrappedSolAccount)
      } else {
        throw new Error('Invalid payer account')
      }
    }

    const placeOrderInstruction = this.makePlaceOrderInstruction(connection, {
      owner,
      payer: wrappedSolAccount?.publicKey ?? payer,
      side,
      price,
      size,
      orderType,
      clientId,
      openOrdersAddressKey: openOrdersAddress,
      feeDiscountPubkey: useFeeDiscountPubkey,
    })
    transaction.add(placeOrderInstruction)

    if (wrappedSolAccount) {
      transaction.add(
        Token.closeAccount(
          wrappedSolAccount.publicKey,
          ownerAddress,
          ownerAddress,
        ),
      )
    }

    return { transaction, signers, payer: owner }
  }

  makePlaceOrderInstruction(
    connection,
    {
      owner,
      payer,
      side,
      price,
      size,
      orderType = 'limit',
      clientId,
      openOrdersAddressKey,
      openOrdersAccount,
      feeDiscountPubkey = null,
    },
  ) {
    // @ts-ignore
    const ownerAddress = owner.publicKey ?? owner
    if (this.market.baseSizeNumberToLots(size).lte(new BN(0))) {
      throw new Error('size too small')
    }
    if (this.market.priceNumberToLots(price).lte(new BN(0))) {
      throw new Error('invalid price')
    }

    console.log(
      'Using openOrdersAddress',
      openOrdersAccount
        ? openOrdersAccount.publicKey.toString()
        : openOrdersAddressKey.toString(),
    )
    return DexInstructions.newOrder({
      market: this.market.address,
      requestQueue: this.market._decoded.requestQueue,
      baseVault: this.market._decoded.baseVault,
      quoteVault: this.market._decoded.quoteVault,
      openOrders: openOrdersAccount
        ? openOrdersAccount.publicKey
        : openOrdersAddressKey,
      owner: ownerAddress,
      payer,
      side,
      limitPrice: this.market.priceNumberToLots(price),
      maxQuantity: this.market.baseSizeNumberToLots(size),
      orderType,
      clientId,
      programId: this.market._programId,
      feeDiscountPubkey,
    })
  }

  async consumeEvents(wallet, openOrdersAccounts, limit, programId) {
    const tx = DexInstructions.consumeEvents({
      market: this.market._decoded.ownAddress,
      eventQueue: this.market._decoded.eventQueue,
      openOrdersAccounts,
      limit,
      programId,
    })

    return sendAndConfirmTransaction(this.connection, tx, [wallet], {
      skipPreflight: false,
      commitment: 'max',
      preflightCommitment: 'recent',
    })
  }
}
