import Wallet from '@project-serum/sol-wallet-adapter';
import { isBrowser } from '../../isNode';

let solflare;

if (isBrowser) {
  // #TODO: second param just a empty string to get around TS error?
  solflare = new Wallet('https://solflare.com/provider', '');
}

const getAdapter = () => {
  return solflare;
};

export default getAdapter;
