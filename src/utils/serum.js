import { Market, MARKETS } from '@project-serum/serum';


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
}