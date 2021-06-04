import WalletAdapter from './src/utils/wallet/walletAdapter'

interface SolongAdapter extends WalletAdapter {
  selectAccount: () => Promise<string>
}

export interface MathOrPhantomAdapter extends WalletAdapter {
  isMathWallet: boolean
  isPhantom: boolean
  getAccount: () => Promise<string>
  connect: ({ onlyIfTrusted: boolean }) => void
}

declare global {
  interface Window {
    solana?: MathOrPhantomAdapter
    solong?: SolongAdapter
  }
}
