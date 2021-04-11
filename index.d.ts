import WalletAdapter from './src/utils/wallet/walletAdapter'

interface SolongAdapter extends WalletAdapter {
  selectAccount: () => Promise<string>
}

export interface MathAdapter extends WalletAdapter {
  isMathWallet: boolean
  getAccount: () => Promise<string>
}

declare global {
  interface Window {
    solana?: MathAdapter
    solong?: SolongAdapter
  }
}
