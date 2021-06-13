export default class TransactionError extends Error {
  public txid: string

  constructor(message: string, txid?: string) {
    super(message)
    this.txid = txid
  }
}
