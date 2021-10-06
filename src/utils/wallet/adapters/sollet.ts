import Wallet from '@project-serum/sol-wallet-adapter';
import { isBrowser } from '../../isNode';
import WalletAdapter from '../walletAdapter';

let sollet: Wallet;

if (isBrowser) {
  sollet = new Wallet('https://www.sollet.io', '');
}

const getAdapter = (): WalletAdapter => {
  return sollet as WalletAdapter;
};

export default getAdapter;
