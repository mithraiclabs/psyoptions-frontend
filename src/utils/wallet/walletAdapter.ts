import { PublicKey, SignaturePubkeyPair, Transaction } from '@solana/web3.js'

interface WalletEventCallback { (key: PublicKey): void }

// Base interface from the "sol-wallet-adapter" module
// All wallet adapters for different wallets should be wrapped to use this interface
interface WalletAdapter {
  publicKey: PublicKey,
  connected: boolean,
  autoApprove: boolean,

  connect(): Promise<void>, 

  disconnect(): Promise<void>,

  sign(data: Buffer, display: string): Promise<SignaturePubkeyPair>,

  signTransaction(transaction: Transaction): Promise<Transaction>,

  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>,

  on(event: string, callback: WalletEventCallback)
}

export default WalletAdapter
