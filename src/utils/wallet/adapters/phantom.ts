import EventEmitter from 'eventemitter3'
import { PublicKey, Transaction } from '@mithraic-labs/solana-web3.js'
import type WalletAdapter from '../walletAdapter'
import { isBrowser } from '../../isNode'

type PhantomEvent = 'disconnect' | 'connect'
type PhantomRequestMethod =
  | 'connect'
  | 'disconnect'
  | 'signTransaction'
  | 'signAllTransactions'

interface PhantomProvider {
  publicKey?: PublicKey
  isConnected?: boolean
  autoApprove?: boolean
  signTransaction: (transaction: Transaction) => Promise<Transaction>
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>
  connect: ({ onlyIfTrusted: boolean }) => Promise<void>
  disconnect: () => Promise<void>
  on: (event: PhantomEvent, handler: (args: any) => void) => void
  request: (method: PhantomRequestMethod, params: any) => Promise<any>
  listeners: (event: PhantomEvent) => (() => void)[]
}

class PhantomWalletAdapter extends EventEmitter implements WalletAdapter {
  constructor() {
    super()
    this.connect = this.connect.bind(this)
  }

  // eslint-disable-next-line
  private get _provider(): PhantomProvider | undefined {
    if ((window as any)?.solana?.isPhantom) {
      return (window as any).solana
    }
    return undefined
  }

  private _handleConnect = (...args) => {
    this.emit('connect', ...args)
  }

  private _handleDisconnect = (...args) => {
    this.emit('disconnect', ...args)
  }

  get connected() {
    return this._provider?.isConnected || false
  }

  get autoApprove() {
    return this._provider?.autoApprove || false
  }

  async signAllTransactions(
    transactions: Transaction[],
  ): Promise<Transaction[]> {
    if (!this._provider) {
      return transactions
    }

    return this._provider.signAllTransactions(transactions)
  }

  get publicKey() {
    return this._provider?.publicKey
  }

  async signTransaction(transaction: Transaction) {
    if (!this._provider) {
      return transaction
    }

    return this._provider.signTransaction(transaction)
  }

  async connect(args) {
    if (!isBrowser) {
      return
    }
    if (!this._provider) {
      window.open('https://phantom.app/', '_blank')
      return
    }
    if (!this._provider.listeners('connect').length) {
      this._provider?.on('connect', this._handleConnect)
    }
    if (!this._provider.listeners('disconnect').length) {
      this._provider?.on('disconnect', this._handleDisconnect)
    }
    // eslint-disable-next-line
    return this._provider?.connect(args)
  }

  async disconnect() {
    if (this._provider) {
      this._provider.disconnect()
    }
  }
}

const phantom = new PhantomWalletAdapter()

const getAdapter = (): WalletAdapter => {
  return phantom
}

export default getAdapter
