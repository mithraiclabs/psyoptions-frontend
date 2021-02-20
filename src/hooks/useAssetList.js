// Getting icons from trustwallet's github for now - this is what serum does
const trustWalletBlockchainIcon = (name) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${name}/info/logo.png`

const trustWalletERC20Icon = (address) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`

// Hard-coded asset list for now
// We can make this pull from some API(s) later
const assetList = [
  {
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    image: trustWalletBlockchainIcon('solana'),
  },
  {
    mint: 'BQcdHdAQW1hczDbBi9hiegXAR7A98Q9jx3X3iBBBDiq4',
    symbol: 'USDT',
    name: 'Tether',
    image: trustWalletERC20Icon('0xdAC17F958D2ee523a2206206994597C13D831ec7'),
  },
  {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'Circle',
    image: trustWalletERC20Icon('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
  },
  {
    mint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
    symbol: 'BTC',
    name: 'Bitcoin',
    image: trustWalletBlockchainIcon('bitcoin'),
  },
  {
    mint: '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk',
    symbol: 'ETH',
    name: 'Ethereum',
    image: trustWalletBlockchainIcon('ethereum'),
  },
  {
    mint: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
    symbol: 'SRM',
    name: 'Serum',
    image: trustWalletERC20Icon('0x476c5E26a75bd202a9683ffD34359C0CC15be0fF'),
  },
]

const useAssetList = () => {
  return assetList
}

export default useAssetList
