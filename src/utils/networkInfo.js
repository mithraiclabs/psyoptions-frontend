import { clusterApiUrl } from '@solana/web3.js'
import { TOKENS } from '@project-serum/tokens'

// Note these network values are used for determining the asset list.
// Be sure to update that when modifying the order of this list.
const networks = [
  {
    name: 'Mainnet',
    url: clusterApiUrl('mainnet-beta'),
    programId: process.env.MAINNET_PROGRAM_ID,
  },
  {
    name: 'Devnet',
    url: clusterApiUrl('devnet'),
    programId: process.env.DEVNET_PROGRAM_ID,
  },
  {
    name: 'Testnet',
    url: clusterApiUrl('testnet'),
    programId: process.env.TESTNET_PROGRAM_ID,
  },
  {
    name: 'localhost',
    url: 'http://127.0.0.1:8899',
    programId: process.env.LOCAL_PROGRAM_ID,
  },
]

const getSerumMarketsByNetwork = (name) => {
  switch (name) {
    case networks[0].name:
      return TOKENS.mainnet
    case networks[1].name:
      return [
        {
          baseAssetMint: 'So11111111111111111111111111111111111111112',
          quoteAssetMint: '2ShyNZqKffdYKMV6Pm8Ypcxj8GQwvFiAUkfTiyxq9v42',
          marketAddress: 'HzCPDBWufc21nDjSUwcTVxjFjYCpktHMNewmuNHXdhtx'
        },
        {
          baseAssetMint: '2ShyNZqKffdYKMV6Pm8Ypcxj8GQwvFiAUkfTiyxq9v42',
          quoteAssetMint: 'So11111111111111111111111111111111111111112',
          marketAddress: '339KS1xbJLkfbF5ph3M9AbQpp1LnbPx6L2tReyQR5KD1'
        },
        {
          baseAssetMint: '2ShyNZqKffdYKMV6Pm8Ypcxj8GQwvFiAUkfTiyxq9v42',
          quoteAssetMint: 'HinfVnJuzMtJsyuLE2ArYCChDZB6FCxEu2p3CQeMcDiF',
          marketAddress: 'ChLBxZL8RjQ2DhyrZakuTN9nPNjQn23sN7k2fPsSGxuu'
        }
      ]
    case networks[2].name:
      return TOKENS.testnet
    case networks[3].name:
      return []
    default:
      return []
  }
}

const getAssetsByNetwork = (name) => {
  switch (name) {
    case networks[0].name:
      return TOKENS.mainnet
    case networks[1].name:
      return [
        {
          "tokenSymbol": "SOL",
          "mintAddress": "So11111111111111111111111111111111111111112",
          "tokenName": "Solana",
          "icon": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png"
        },
        {
          "tokenSymbol": "PSYA",
          "mintAddress": "2ShyNZqKffdYKMV6Pm8Ypcxj8GQwvFiAUkfTiyxq9v42",
          "tokenName": "PSYA Test",
          "icon": "https://raw.githubusercontent.com/trustwallet/assets/08d734b5e6ec95227dc50efef3a9cdfea4c398a1/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png"
        },
        {
          "tokenSymbol": "PSYB",
          "mintAddress": "HinfVnJuzMtJsyuLE2ArYCChDZB6FCxEu2p3CQeMcDiF",
          "tokenName": "PSYB Test",
          "icon": "https://raw.githubusercontent.com/trustwallet/assets/08d734b5e6ec95227dc50efef3a9cdfea4c398a1/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png"
        }
      ]
    case networks[2].name:
      return TOKENS.testnet
    case networks[3].name:
      try {
        const localnetData = require('../hooks/localnetData.json')
        return [TOKENS.mainnet[0], ...localnetData]
      } catch (err) {
        console.error('localnet data not found at ./localnetData.json')
        return []
      }
    default:
      return []
  }
}

export {getAssetsByNetwork, getSerumMarketsByNetwork, networks};