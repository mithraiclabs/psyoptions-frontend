import type WalletAdapter from './walletAdapter'

import getSolletAdapter from './adapters/sollet'
import getPhantomAdapter from './adapters/phantom'
import getMathAdapter from './adapters/math'
import getSolongAdapter from './adapters/solong'
import getLedgerAdapter from './adapters/ledger/ledger'

type GetAdapterFunction = () => WalletAdapter | undefined

interface Wallet {
  name: string
  icon: string
  getAdapter: GetAdapterFunction
}

// TODO add icons
const wallets: Wallet[] = [
  {
    name: 'Sollet',
    icon: '',
    getAdapter: getSolletAdapter,
  },
  {
    name: 'Phantom',
    icon: '',
    getAdapter: getPhantomAdapter,
  },
  {
    name: 'Solong',
    icon: '',
    getAdapter: getSolongAdapter,
  },
  {
    name: 'Math',
    icon: '',
    getAdapter: getMathAdapter,
  },
  {
    name: 'Ledger',
    icon: '',
    getAdapter: getLedgerAdapter,
  },
]

export default wallets
