import EventEmitter from 'eventemitter3'
import { PublicKey, Transaction } from '@solana/web3.js'
import type WalletAdapter from '../walletAdapter'
import { MathOrPhantomAdapter } from '../../../..'

class MathWalletAdapter extends EventEmitter implements WalletAdapter {
  _publicKey?: PublicKey

  _onProcess: boolean

  _connected: boolean

  constructor() {
    super()
    this._onProcess = false
    this._connected = false
    this.connect = this.connect.bind(this)
  }

  get connected(): boolean {
    return this._connected
  }

  // eslint-disable-next-line
  get autoApprove(): boolean {
    return false
  }

  public async signAllTransactions(
    transactions: Transaction[],
  ): Promise<Transaction[]> {
    if (!this._provider) {
      return transactions
    }

    return this._provider.signAllTransactions(transactions)
  }

  // eslint-disable-next-line
  private get _provider(): MathOrPhantomAdapter | undefined {
    if (typeof window !== 'undefined' && window?.solana?.isMathWallet) {
      return window.solana
    }
    return undefined
  }

  get publicKey(): PublicKey | undefined {
    return this._publicKey
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this._provider) {
      return transaction
    }

    return this._provider.signTransaction(transaction)
  }

  async connect() {
    if (this._onProcess) {
      return
    }

    if (!this._provider) {
      window.open('https://mathwallet.org/', '_blank')
      return
    }

    this._onProcess = true
    this._provider
      .getAccount()
      .then((account: any) => {
        this._publicKey = new PublicKey(account)
        this._connected = true
        this.emit('connect', this._publicKey)
      })
      .catch(() => {
        this.disconnect()
      })
      .finally(() => {
        this._onProcess = false
      })
  }

  async disconnect() {
    if (this._publicKey) {
      this._publicKey = undefined
      this._connected = false
      this.emit('disconnect')
    }
  }
}

const adapter = new MathWalletAdapter()

const getAdapter = (): WalletAdapter => {
  return adapter
}

export default getAdapter
