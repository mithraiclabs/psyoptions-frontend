import WalletAdapter from './walletAdapter'

import getSolletAdapter from './adapters/sollet'
import getPhantomAdapter from './adapters/phantom'

type GetAdapterFunction = () => WalletAdapter | undefined

interface Wallet {
  name: string,
  icon: string,
  getAdapter: GetAdapterFunction
}

const wallets: Wallet[] = [
  {
    name: 'Sollet.io',
    icon: '',
    getAdapter: getSolletAdapter
  },
  {
    name: 'Phantom',
    icon: '',
    getAdapter: getPhantomAdapter
  },
]

export default wallets
