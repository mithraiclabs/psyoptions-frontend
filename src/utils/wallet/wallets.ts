import type WalletAdapter from './WalletAdapter';

import getSolletAdapter from './adaptors/sollet';
import getPhantomAdapter from './adaptors/phantom';
import getMathAdapter from './adaptors/math';
import getSolongAdapter from './adaptors/solong';
import getSolflareAdapter from './adaptors/solflare';
import getSolletExtAdaptor from './adaptors/solletExtension';

type GetAdapterFunction = () => WalletAdapter | undefined;

interface Wallet {
  name: string;
  icon: string;
  getAdapter: GetAdapterFunction;
}

const wallets: Wallet[] = [
  {
    name: 'Phantom',
    icon: 'https://www.phantom.app/img/logo.png',
    getAdapter: getPhantomAdapter,
  },
  {
    name: 'Sollet Extension',
    icon: 'https://cdn.jsdelivr.net/gh/solana-labs/oyster@main/assets/wallets/sollet.svg',
    getAdapter: getSolletExtAdaptor,
  },
  {
    name: 'Sollet.io',
    icon: 'https://cdn.jsdelivr.net/gh/solana-labs/oyster@main/assets/wallets/sollet.svg',
    getAdapter: getSolletAdapter,
  },
  {
    name: 'Solflare',
    icon: 'https://gblobscdn.gitbook.com/orgs%2F-Mgv3QYvaCvwd1aumNxD%2Favatar-1629474341006.png?alt=media',
    getAdapter: getSolflareAdapter,
  },
  {
    name: 'Solong',
    icon: 'https://cdn.jsdelivr.net/gh/solana-labs/oyster@main/assets/wallets/solong.png',
    getAdapter: getSolongAdapter,
  },
  {
    name: 'MathWallet',
    icon: 'https://cdn.jsdelivr.net/gh/solana-labs/oyster@main/assets/wallets/mathwallet.svg',
    getAdapter: getMathAdapter,
  },
];

export default wallets;
