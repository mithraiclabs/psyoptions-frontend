import { Market, MARKETS } from '@project-serum/serum';
import { PublicKey, Transaction } from '@solana/web3.js';


export class SerumMarket {

  constructor(connection, marketAddress) {
    this.connection = connection;
    this.marketAddress = marketAddress;
    this.market = await SerumMarket.getMarket();
  }

  /**
   * 
   * @param {Connection} connection 
   * @param {PublicKey} marketAddress 
   */
  static getMarket = async () => {
    const programId = MARKETS.find(({ deprecated }) => !deprecated).programId;
    return Market.load(this.connection, this.marketAddress, {}, programId);
  }

  /**
   * Returns the highest bid price and lowest ask price for a market
   */
  getBidAskSpread = async () => {
    if (!this.market) {
      return {bid: null, ask: null}
    }
    const bidOrderbook = await this.market.loadBids(connection);
    const askOrderbook = await this.market.loadAsks(connection);

    const highestbid = bidOrderbook.getL2(1)[0];
    const lowestAsk = askOrderbook.getL2(1)[0];
    return {bid: highestbid[1], ask: lowestAsk[1]};
  }

  getPrice = async () => {
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
  createPlaceOrderTx = async (
    owner,
    payer,
    side,
    price,
    size,
    orderType,
    opts = {},
  ) => {
    const params = {
      owner,
      payer,
      side,
      price,
      size,
      orderType,
      feeDiscountPubkey: opts.feeDiscountPubkey || null,
    };
    return market.makePlaceOrderTransaction(
      this.connection,
      params,
      120_000,
      120_000,
    )
  }
}