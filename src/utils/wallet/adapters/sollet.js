import Wallet from '@project-serum/sol-wallet-adapter'
import { isBrowser } from '../../isNode'

let sollet

if (isBrowser) {
  sollet = new Wallet('https://sollet.io')
}

const getAdapter = () => {
  return sollet
}

export default getAdapter
