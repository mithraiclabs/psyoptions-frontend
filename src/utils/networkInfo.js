import { clusterApiUrl, PublicKey } from '@solana/web3.js'
import { TOKENS } from '@project-serum/tokens'
import { MARKETS } from '@mithraic-labs/serum'

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
    // url: 'https://devnet.psyoptions.io',
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

const getDexProgramKeyByNetwork = (name) => {
  switch (name) {
    case 'Mainnet':
      return MARKETS.find(({ deprecated }) => !deprecated).programId
    case 'Devnet':
      return new PublicKey(process.env.DEVNET_DEX_PROGRAM_ID)
    case 'Testnet':
      // NOTE THIS WILL NOT WORK BECUASE THERE IS NO SERUM DEX DEPLOYED TO TESTNET
      return new PublicKey(process.env.TESTNET_DEX_PROGRAM_ID)
    case 'localhost':
      // TODO fix this when we can work through the issues with Serum locally
      // NOTE THIS WILL NOT WORK LOCALLY (fix the commented out section)
      // const serumDexKeyBuffer = fs.readFileSync(ScriptHelpers.serumDexProgramKeypair);
      // const dexProgramAccount = new Account(JSON.parse(serumDexKeyBuffer));
      // const dexProgramId = dexProgramAccount.publicKey;
      return new PublicKey(process.env.LOCAL_DEX_PROGRAM_ID)
    default:
      return []
  }
}

const getSerumMarketsByNetwork = (name) => {
  switch (name) {
    case networks[0].name:
      return TOKENS.mainnet
    case networks[1].name:
      return [
        {
          baseAssetMint: 'So11111111111111111111111111111111111111112',
          quoteAssetMint: '2ShyNZqKffdYKMV6Pm8Ypcxj8GQwvFiAUkfTiyxq9v42',
          marketAddress: 'HzCPDBWufc21nDjSUwcTVxjFjYCpktHMNewmuNHXdhtx',
        },
        {
          baseAssetMint: '2ShyNZqKffdYKMV6Pm8Ypcxj8GQwvFiAUkfTiyxq9v42',
          quoteAssetMint: 'So11111111111111111111111111111111111111112',
          marketAddress: '339KS1xbJLkfbF5ph3M9AbQpp1LnbPx6L2tReyQR5KD1',
        },
        {
          baseAssetMint: '2ShyNZqKffdYKMV6Pm8Ypcxj8GQwvFiAUkfTiyxq9v42',
          quoteAssetMint: 'HinfVnJuzMtJsyuLE2ArYCChDZB6FCxEu2p3CQeMcDiF',
          marketAddress: 'ChLBxZL8RjQ2DhyrZakuTN9nPNjQn23sN7k2fPsSGxuu',
        },
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
      // Devnet tokens and faucets can be found [here](https://github.com/blockworks-foundation/mango-client-ts/blob/main/src/ids.json#L10)
      return [
        {
          tokenSymbol: 'SOL',
          mintAddress: 'So11111111111111111111111111111111111111112',
          tokenName: 'Solana',
          icon:
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
        },
        {
          tokenSymbol: 'BTC',
          mintAddress: 'C6kYXcaRUMqeBF5fhg165RWU7AnpT9z92fvKNoMqjmz6',
          tokenName: 'Bitcoin',
          icon:
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
        },
        {
          tokenSymbol: 'PSY',
          mintAddress: 'BzwRWwr1kCLJVUUM14fQthP6FJKrGpXjw3ZHTZ6PQsYa',
          tokenName: 'PSY Test',
          icon:
            'https://raw.githubusercontent.com/trustwallet/assets/08d734b5e6ec95227dc50efef3a9cdfea4c398a1/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
        },
        {
          tokenSymbol: 'USDC',
          mintAddress: 'HinfVnJuzMtJsyuLE2ArYCChDZB6FCxEu2p3CQeMcDiF',
          tokenName: 'USDC',
          icon:
            'https://raw.githubusercontent.com/trustwallet/assets/f3ffd0b9ae2165336279ce2f8db1981a55ce30f8/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
        },
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

export {
  getAssetsByNetwork,
  getDexProgramKeyByNetwork,
  getSerumMarketsByNetwork,
  networks,
}
