import { isBrowser } from '../../isNode'

const getAdapter = () => {
  let phantom

  if (isBrowser) {
    if (window.solana && window.solana.isPhantom) {
      phantom = window.solana
    }
  }

  return phantom
}

export default getAdapter
