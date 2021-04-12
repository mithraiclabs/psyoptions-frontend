import type WalletAdapter from './walletAdapter'

import getSolletAdapter from './adapters/sollet'
import getPhantomAdapter from './adapters/phantom'
import getMathAdapter from './adapters/math'
import getSolongAdapter from './adapters/solong'
// import getLedgerAdapter from './adapters/ledger/ledger'

type GetAdapterFunction = () => WalletAdapter | undefined

interface Wallet {
  name: string
  icon: string
  getAdapter: GetAdapterFunction
}

// TODO add icons
const wallets: Wallet[] = [
  {
    name: 'Sollet.io',
    icon:
      'https://cdn.jsdelivr.net/gh/solana-labs/oyster@main/assets/wallets/sollet.svg',
    getAdapter: getSolletAdapter,
  },
  {
    name: 'Phantom',
    icon: 'https://www.phantom.app/img/logo.png',
    getAdapter: getPhantomAdapter,
  },
  {
    name: 'Solong',
    icon:
      'https://cdn.jsdelivr.net/gh/solana-labs/oyster@main/assets/wallets/solong.png',
    getAdapter: getSolongAdapter,
  },
  {
    name: 'MathWallet',
    icon:
      'https://cdn.jsdelivr.net/gh/solana-labs/oyster@main/assets/wallets/mathwallet.svg',
    getAdapter: getMathAdapter,
  },
  // {
  //   name: 'Ledger',
  //   icon: 'https://cdn.jsdelivr.net/gh/solana-labs/oyster@main/assets/wallets/ledger.svg',
  //   getAdapter: getLedgerAdapter,
  // },
]

export default wallets
