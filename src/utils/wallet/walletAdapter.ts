import { PublicKey, SignaturePubkeyPair, Transaction } from '@solana/web3.js';

interface WalletEventCallback {
  (key: PublicKey | undefined): void;
}

// Base interface from the "sol-wallet-adapter" module
// All wallet adapters for different wallets should be wrapped to use this interface
interface WalletAdapter {
  publicKey: PublicKey;
  connected: boolean;
  autoApprove: boolean;

  connect(args): Promise<void>;

  disconnect(): Promise<void>;

  sign?: (data: Buffer, display: string) => Promise<SignaturePubkeyPair>;

  signTransaction: (transaction: Transaction) => Promise<Transaction>;

  signAllTransactions: (transaction: Transaction[]) => Promise<Transaction[]>;

  on: (event: string, callback: WalletEventCallback) => this;
}

export default WalletAdapter;
