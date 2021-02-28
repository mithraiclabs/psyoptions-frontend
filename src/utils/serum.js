import { 
  DexInstructions,
  Market, 
  _MARKET_STATE_LAYOUT_V2,
  OpenOrders,
} from '@project-serum/serum';
import { 
  Account,
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  TOKEN_PROGRAM_ID,
} from '@solana/web3.js';
import BN from 'bn.js';

import { Token } from '@solana/spl-token';

const SOL_MINT = new PublicKey(
  'So11111111111111111111111111111111111111112',
);

// To initialize a new market, use the initializeSerumMarket from the options protocol bindings package

export class SerumMarket {

  /**
   * 
   * @param {Connection} connection 
   * @param {PublicKey} marketAddress 
   * @param {PublicKey} dexProgramKey 
   */
  constructor (connection, marketAddress, dexProgramKey) {
    this.MARKET_LAYOUT = _MARKET_STATE_LAYOUT_V2;
    this.connection = connection;
    this.marketAddress = marketAddress;
    this.dexProgramKey = dexProgramKey;
  }

  async initMarket () {
    this.market = await this.getMarket();
  }

  /**
   * Look up a Serum market via the Base and Quote mint addresses.
   * @param {PublicKey} baseMintAddress 
   * @param {PublicKey} quoteMintAddress 
   */
  static async getMarketByAssetKeys (
    connection,
    baseMintAddress,
    quoteMintAddress,
  ) {
    const filters = [
      {
        memcmp: {
          offset: this.MARKET_LAYOUT.offsetOf('baseMint'),
          bytes: baseMintAddress.toBase58(),
        },
      },
      {
        memcmp: {
          offset: this.MARKET_LAYOUT.offsetOf('quoteMint'),
          bytes: quoteMintAddress.toBase58(),
        },
      },
    ];
    const resp = await connection._rpcRequest('getProgramAccounts', [
      this.dexProgramKey.toBase58(),
      {
        commitment: connection.commitment,
        filters,
        encoding: 'base64',
      },
    ]);
    if (resp.error) {
      throw new Error(resp.error.message);
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
    );
  }

  /**
   * 
   * @param {Connection} connection 
   * @param {PublicKey} marketAddress 
   */
  async getMarket () {
    return Market.load(this.connection, this.marketAddress, {}, this.dexProgramKey);
  }

  /**
   * Returns the highest bid price and lowest ask price for a market
   */
  async getBidAskSpread () {
    if (!this.market) {
      return {bid: null, ask: null}
    }
    const bidOrderbook = await this.market.loadBids(this.connection);
    const askOrderbook = await this.market.loadAsks(this.connection);

    const highestbid = bidOrderbook.getL2(1)[0];
    const lowestAsk = askOrderbook.getL2(1)[0];
    return {bid: highestbid[0], ask: lowestAsk[0]};
  }

  async getPrice () {
    const {bid, ask} = await this.getBidAskSpread();
    return ((ask - bid) / 2) + bid
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
  async createPlaceOrderTx (
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
    };
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
    const {
      transaction,
      signers,
    } = await this.makePlaceOrderTransaction(connection, {
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
    });

    await sendAndConfirmTransaction(connection, transaction, [owner, ...signers], {
      skipPreflight: false,
      commitment: 'max',
      preflightCommitment: 'recent',
    });
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
    const ownerAddress = owner.publicKey ?? owner;
    const openOrdersAccounts = await this.market.findOpenOrdersAccountsForOwner(
      connection,
      ownerAddress,
      cacheDurationMs,
    );
    const transaction = new Transaction();
    const signers = [];

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
    const useFeeDiscountPubkey = null;
    // }

    let openOrdersAddress;
    if (openOrdersAccounts.length === 0) {
      let account;
      if (openOrdersAccount) {
        account = openOrdersAccount;
      } else {
        account = new Account();
      }
      transaction.add(
        await OpenOrders.makeCreateAccountTransaction(
          connection,
          this.market.address,
          ownerAddress,
          account.publicKey,
          this.market._programId,
        ),
      );
      openOrdersAddress = account.publicKey;
      signers.push(account);
      // refresh the cache of open order accounts on next fetch
      this.market._openOrdersAccountsCache[ownerAddress.toBase58()].ts = 0;
    } else if (openOrdersAccount) {
      openOrdersAddress = openOrdersAccount.publicKey;
    } else if (openOrdersAddressKey) {
      openOrdersAddress = openOrdersAddressKey;
    } else {
      openOrdersAddress = openOrdersAccounts[0].address;
    }

    let wrappedSolAccount = null;
    if (payer.equals(ownerAddress)) {
      if (
        (side === 'buy' && this.market.quoteMintAddress.equals(SOL_MINT)) ||
        (side === 'sell' && this.market.baseMintAddress.equals(SOL_MINT))
      ) {
        wrappedSolAccount = new Account();
        let lamports;
        if (side === 'buy') {
          lamports = Math.round(price * size * 1.01 * LAMPORTS_PER_SOL);
          if (openOrdersAccounts.length > 0) {
            lamports -= openOrdersAccounts[0].quoteTokenFree.toNumber();
          }
        } else {
          lamports = Math.round(size * LAMPORTS_PER_SOL);
          if (openOrdersAccounts.length > 0) {
            lamports -= openOrdersAccounts[0].baseTokenFree.toNumber();
          }
        }
        lamports = Math.max(lamports, 0) + 1e7;
        transaction.add(
          SystemProgram.createAccount({
            fromPubkey: ownerAddress,
            newAccountPubkey: wrappedSolAccount.publicKey,
            lamports,
            space: 165,
            programId: TOKEN_PROGRAM_ID,
          }),
        );
        transaction.add(
          Token.createInitAccountInstruction(
            TOKEN_PROGRAM_ID,
            SOL_MINT,
            wrappedSolAccount.publicKey,
            ownerAddress,
          ),
        );
        signers.push(wrappedSolAccount);
      } else {
        throw new Error('Invalid payer account');
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
    });
    transaction.add(placeOrderInstruction);

    if (wrappedSolAccount) {
      transaction.add(
        Token.closeAccount(
          wrappedSolAccount.publicKey,
          ownerAddress,
          ownerAddress,
        ),
      );
    }

    return { transaction, signers, payer: owner };
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
  ){
    // @ts-ignore
    const ownerAddress = owner.publicKey ?? owner;
    if (this.market.baseSizeNumberToLots(size).lte(new BN(0))) {
      throw new Error('size too small');
    }
    if (this.market.priceNumberToLots(price).lte(new BN(0))) {
      throw new Error('invalid price');
    }

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
    });
  }
}