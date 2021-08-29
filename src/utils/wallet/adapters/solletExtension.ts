import Wallet from '@project-serum/sol-wallet-adapter';

import { isBrowser } from '../../isNode';

let solletExtAdaptor;

if (isBrowser && (window as any)?.sollet) {
  solletExtAdaptor = new Wallet((window as any).sollet);
}

const getAdapter = () => {
  return solletExtAdaptor;
};

export default getAdapter;
