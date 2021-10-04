import Wallet from '@project-serum/sol-wallet-adapter';

import { isBrowser } from '../../isNode';
import WalletAdapter from '../walletAdapter';

let solletExtAdaptor: Wallet;

if (isBrowser && window?.sollet) {
  solletExtAdaptor = new Wallet(window.sollet, '');
}

const getAdapter = (): WalletAdapter => {
  return solletExtAdaptor as WalletAdapter;
};

export default getAdapter;
