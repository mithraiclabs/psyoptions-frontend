import { Market, MARKETS } from '@project-serum/serum';


export class CLOBDex {

  constructor(connection, marketAddress) {
    this.connection = connection;
    this.marketAddress = marketAddress;
    this.market = CLOBDex.getSerumMarket();
  }

  /**
   * 
   * @param {Connection} connection 
   * @param {PublicKey} marketAddress 
   */
  static getSerumMarket = async () => {
    const programId = MARKETS.find(({ deprecated }) => !deprecated).programId;
    return Market.load(this.connection, this.marketAddress, {}, programId);
  }

  getBidAskSpread = async () => {
    const bidOrderbook = await this.market.loadBids(connection);
    const askOrderbook = await this.market.loadAsks(connection);

    const highestbid = bidOrderbook.getL2(1)[0];
    const lowestAsk = askOrderbook.getL2(1)[0];
    return {bid: highestbid[1], ask: lowestAsk[1]}
  }
}