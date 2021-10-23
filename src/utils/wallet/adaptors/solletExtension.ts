import Wallet from '@project-serum/sol-wallet-adapter';

import { isBrowser } from '../../isNode';

let solletExtAdaptor;

if (isBrowser && (window as any)?.sollet) {
  // #TODO: second param just a empty string to get around TS error?
  solletExtAdaptor = new Wallet((window as any).sollet, '');
}

const getAdapter = () => {
  return solletExtAdaptor;
};

export default getAdapter;
