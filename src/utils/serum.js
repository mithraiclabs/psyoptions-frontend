import { Market, MARKETS } from '@project-serum/serum';
import { PublicKey } from '@solana/web3.js';

// To initialize a new market, use the initializeSerumMarket from the options protocol bindings package

export class SerumMarket {

  constructor (connection, marketAddress) {
    this.connection = connection;
    this.marketAddress = marketAddress;
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
    const {programId} = MARKETS.find(({ deprecated }) => !deprecated);
    const filters = [
      {
        memcmp: {
          offset: Market.getLayout(programId).offsetOf('baseMint'),
          bytes: baseMintAddress.toBase58(),
        },
      },
      {
        memcmp: {
          offset: Market.getLayout(programId).offsetOf('quoteMint'),
          bytes: quoteMintAddress.toBase58(),
        },
      },
    ];
    const resp = await connection._rpcRequest('getProgramAccounts', [
      programId.toBase58(),
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
    const {programId} = MARKETS.find(({ deprecated }) => !deprecated);
    return Market.load(this.connection, this.marketAddress, {}, programId);
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
}