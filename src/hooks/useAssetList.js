// Getting icons from trustwallet's github for now - this is what serum does
const trustWalletBlockchainIcon = (name) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${name}/info/logo.png`

const trustWalletERC20Icon = (address) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`

// Hard-coded asset list for now
// We can make this pull from some API(s) later
const assetList = [
  {
    splAccount: 'abcdef0',
    symbol: 'SOL',
    name: 'Solana',
    image: trustWalletBlockchainIcon('solana'),
  },
  {
    splAccount: 'abcdef1',
    symbol: 'USDT',
    name: 'Tether',
    image: trustWalletERC20Icon('0xdAC17F958D2ee523a2206206994597C13D831ec7'),
  },
  {
    splAccount: 'abcdef2',
    symbol: 'USDC',
    name: 'Circle',
    image: trustWalletERC20Icon('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
  },
  {
    splAccount: 'abcdef3',
    symbol: 'BTC',
    name: 'Bitcoin',
    image: trustWalletBlockchainIcon('bitcoin'),
  },
  {
    splAccount: 'abcdef4',
    symbol: 'ETH',
    name: 'Ethereum',
    image: trustWalletBlockchainIcon('ethereum'),
  },
  {
    splAccount: 'abcdef5',
    symbol: 'SRM',
    name: 'Serum',
    image: trustWalletERC20Icon('0x476c5E26a75bd202a9683ffD34359C0CC15be0fF'),
  },
]

const useAssetList = () => {
  return assetList
}

export default useAssetList
