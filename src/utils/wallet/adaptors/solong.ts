import EventEmitter from 'eventemitter3';
import { PublicKey, Transaction } from '@solana/web3.js';
import type WalletAdapter from '../WalletAdapter';
// import { isNode } from '../../isNode';

class SolongWalletAdapter extends EventEmitter implements WalletAdapter {
  _publicKey?: PublicKey;

  _onProcess: boolean;

  _connected: boolean;

  constructor() {
    super();
    this._onProcess = false;
    this._connected = false;
    this.connect = this.connect.bind(this);
  }

  get connected(): boolean {
    return this._connected;
  }

  // eslint-disable-next-line
  get autoApprove(): boolean {
    return false;
  }

  // eslint-disable-next-line
  public async signAllTransactions(
    transactions: Transaction[],
  ): Promise<Transaction[]> {
    const { solong } = window;
    if (solong.signAllTransactions) {
      return solong.signAllTransactions(transactions);
    }
    const result: Transaction[] = [];
    // eslint-disable-next-line
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      // eslint-disable-next-line
      const signed = await solong.signTransaction(transaction);
      result.push(signed);
    }

    return result;
  }

  get publicKey(): PublicKey | undefined {
    return this._publicKey;
  }

  // eslint-disable-next-line
  async signTransaction(transaction: Transaction) {
    return window.solong.signTransaction(transaction);
  }

  async connect(): Promise<void> {
    if (this._onProcess || typeof window === 'undefined') {
      return;
    }

    if (window.solong === undefined) {
      window.open('https://solongwallet.com/', '_blank');
      return;
    }

    this._onProcess = true;
    window.solong
      .selectAccount()
      .then((account: any) => {
        this._publicKey = new PublicKey(account);
        this._connected = true;
        this.emit('connect', this._publicKey);
      })
      .catch(() => {
        this.disconnect();
      })
      .finally(() => {
        this._onProcess = false;
      });
  }

  async disconnect(): Promise<void> {
    if (this._publicKey) {
      this._publicKey = undefined;
      this._connected = false;
      this.emit('disconnect');
    }
  }
}

const adapter = new SolongWalletAdapter();

const getAdapter = (): WalletAdapter | undefined => {
  return adapter;
};

export default getAdapter;
