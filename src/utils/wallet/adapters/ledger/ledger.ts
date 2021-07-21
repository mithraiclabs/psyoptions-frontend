import type { Transaction, PublicKey } from '@solana/web3.js'
import type Transport from '@ledgerhq/hw-transport'
import TransportWebUSB from '@ledgerhq/hw-transport-webusb'
import EventEmitter from 'eventemitter3'

import { getPublicKey, signTransaction } from './core'
import type WalletAdapter from '../../walletAdapter'

class LedgerWalletAdapter extends EventEmitter implements WalletAdapter {
  _connecting: boolean

  _publicKey: PublicKey | null

  _transport: Transport | null

  constructor() {
    super()
    this._connecting = false
    this._publicKey = null
    this._transport = null
  }

  get publicKey(): PublicKey | null {
    return this._publicKey
  }

  get connected(): boolean {
    return this._publicKey !== null
  }

  // eslint-disable-next-line
  get autoApprove() {
    return false
  }

  public async signAllTransactions(
    transactions: Transaction[],
  ): Promise<Transaction[]> {
    const result: Transaction[] = []
    // eslint-disable-next-line
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i]
      const signed = await this.signTransaction(transaction) // eslint-disable-line
      result.push(signed)
    }

    return result
  }

  async signTransaction(transaction: Transaction) {
    if (!this._transport || !this._publicKey) {
      throw new Error('Not connected to Ledger')
    }

    // @TODO: account selection (derivation path changes with account)
    const signature = await signTransaction(this._transport, transaction)

    transaction.addSignature(this._publicKey, signature)

    return transaction
  }

  async connect() {
    if (this._connecting) {
      return
    }

    this._connecting = true

    try {
      // @TODO: transport selection (WebUSB, WebHID, bluetooth, ...)
      this._transport = await TransportWebUSB.create()
      // @TODO: account selection
      this._publicKey = await getPublicKey(this._transport)
      this.emit('connect', this._publicKey)
      this._connecting = false
    } catch (error) {
      await this.disconnect()
      this._connecting = false
      // The application implementing the adapter should handle this error on its own, so we throw
      throw error
    }
  }

  async disconnect() {
    let emit = false
    if (this._transport) {
      await this._transport.close()
      this._transport = null
      emit = true
    }

    this._connecting = false
    this._publicKey = null

    if (emit) {
      this.emit('disconnect')
    }
  }
}

const adapter = new LedgerWalletAdapter()

const getAdapter = (): WalletAdapter => adapter

export default getAdapter
