import Wallet from '@project-serum/sol-wallet-adapter';
import { isBrowser } from '../../isNode';
import WalletAdapter from '../walletAdapter';

let solflare: Wallet;

if (isBrowser) {
  solflare = new Wallet('https://solflare.com/provider', '');
}

const getAdapter = (): WalletAdapter => {
  return solflare as WalletAdapter;
};

export default getAdapter;
