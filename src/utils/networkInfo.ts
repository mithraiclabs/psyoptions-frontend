import { clusterApiUrl, PublicKey } from '@solana/web3.js'
import { TOKENS } from '@project-serum/tokens'
import { MARKETS } from '@mithraic-labs/serum'
/* eslint-disable */
import { MarketMeta } from '@mithraic-labs/market-meta'
import { ClusterName } from '../types'

type Network = {
  name: ClusterName
  url: string
  programId: string
}

// Note these network values are used for determining the asset list.
// Be sure to update that when modifying the order of this list.
const networks: Network[] = [
  {
    name: ClusterName.mainnet,
    url: clusterApiUrl('mainnet-beta'),
    programId: process.env.MAINNET_PROGRAM_ID,
  },
  {
    name: ClusterName.devnet,
    url: clusterApiUrl('devnet'),
    // url: 'https://devnet.psyoptions.io',
    programId: process.env.DEVNET_PROGRAM_ID,
  },
  {
    name: ClusterName.testnet,
    url: clusterApiUrl('testnet'),
    programId: process.env.TESTNET_PROGRAM_ID,
  },
  {
    name: ClusterName.localhost,
    url: 'http://127.0.0.1:8899',
    programId: process.env.LOCAL_PROGRAM_ID,
  },
]

const getDexProgramKeyByNetwork = (name: ClusterName) => {
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

const getSerumMarketsByNetwork = (name: ClusterName) => {
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
      ]
    case networks[2].name:
      return TOKENS.testnet
    case networks[3].name:
      return []
    default:
      return []
  }
}

const getSupportedMarketsByNetwork = (name: ClusterName) => {
  switch (name) {
    case ClusterName.mainnet:
      return MarketMeta.mainnet.optionMarkets
    case ClusterName.devnet:
      return MarketMeta.devnet.optionMarkets
    case ClusterName.testnet:
      return MarketMeta.testnet.optionMarkets
    case ClusterName.localhost:
      // TODO figure out how to best handle this locally
      throw new Error('must set local supported markets')
    default:
      return []
  }
}

const getAssetsByNetwork = (name: ClusterName) => {
  switch (name) {
    case ClusterName.mainnet:
      return MarketMeta.mainnet.tokens
    case ClusterName.devnet:
      // Devnet tokens and faucets can be found [here](https://github.com/blockworks-foundation/mango-client-ts/blob/main/src/ids.json#L10)
      return MarketMeta.devnet.tokens
    case ClusterName.testnet:
      return MarketMeta.testnet.tokens
    case ClusterName.localhost:
      try {
        /* eslint-disable */
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
  getSupportedMarketsByNetwork,
  getSerumMarketsByNetwork,
  networks,
}
