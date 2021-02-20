import { TOKENS } from '@project-serum/tokens'
import { networks } from '../context/ConnectionContext'
import useConnection from './useConnection'

// Getting icons from trustwallet's github for now - this is what serum does
const trustWalletBlockchainIcon = (name) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${name}/info/logo.png`

const trustWalletERC20Icon = (address) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`

// Hard-coded asset list for now
// We can make this pull from some API(s) later
const assetList = [
  {
    mintAddress: 'So11111111111111111111111111111111111111112',
    tokenSymbol: 'SOL',
    tokenName: 'Solana',
    icon: trustWalletBlockchainIcon('solana'),
  },
  {
    mintAddress: 'BQcdHdAQW1hczDbBi9hiegXAR7A98Q9jx3X3iBBBDiq4',
    tokenSymbol: 'USDT',
    tokenName: 'Tether',
    icon: trustWalletERC20Icon('0xdAC17F958D2ee523a2206206994597C13D831ec7'),
  },
  {
    mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    tokenSymbol: 'USDC',
    tokenName: 'Circle',
    icon: trustWalletERC20Icon('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
  },
  {
    mintAddress: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
    tokenSymbol: 'BTC',
    tokenName: 'Bitcoin',
    icon: trustWalletBlockchainIcon('bitcoin'),
  },
  {
    mintAddress: '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk',
    tokenSymbol: 'ETH',
    tokenName: 'Ethereum',
    icon: trustWalletBlockchainIcon('ethereum'),
  },
  {
    mintAddress: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
    tokenSymbol: 'SRM',
    tokenName: 'Serum',
    icon: trustWalletERC20Icon('0x476c5E26a75bd202a9683ffD34359C0CC15be0fF'),
  },
]

const useAssetList = () => {
  const { endpoint } = useConnection()

  switch (endpoint.name) {
    case networks[0].name:
      return TOKENS.mainnet
    case networks[1].name:
      return TOKENS.devnet
    case networks[2].name:
      return TOKENS.testnet
    default:
      return assetList
  }
}

export default useAssetList
