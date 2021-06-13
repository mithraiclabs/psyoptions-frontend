import TransactionError from './TransactionError'

export class TimeoutError extends TransactionError {
  public timeout: boolean

  constructor(message: string, txid?: string) {
    super(message)
    this.timeout = true
  }
}
