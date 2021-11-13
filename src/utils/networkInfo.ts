import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import { TOKENS } from '@project-serum/tokens';
import { MARKETS } from '@mithraic-labs/serum';
/* eslint-disable */
import { MarketMeta } from '@mithraic-labs/market-meta';
import { ClusterName } from '../types';
import { Token } from '@mithraic-labs/market-meta/dist/types';
import { Program } from '@project-serum/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token as SPLToken,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { FEE_OWNER_KEY } from '@mithraic-labs/psy-american';

export type Network = {
  name: ClusterName;
  url: string;
  fallbackUrl: string;
  programId: string | undefined;
  wsEndpoint?: string;
  serumReferrerIds: Record<string, PublicKey>;
};

// Note these network values are used for determining the asset list.
// Be sure to update that when modifying the order of this list.
const networks: Network[] = [
  {
    name: ClusterName.mainnet,
    url: 'https://psyoptions.genesysgo.net',
    fallbackUrl: clusterApiUrl('mainnet-beta'),
    programId: process.env.REACT_APP_MAINNET_PROGRAM_ID,
    serumReferrerIds: {
      EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: new PublicKey(
        'CzuipkNnvG4JaTQPjgAseWLNhLZFYxMcYpd2G8hDLHco',
      ),
    },
  },
  {
    name: ClusterName.devnet,
    url: 'https://psytrbhymqlkfrhudd.dev.genesysgo.net:8899',
    fallbackUrl: clusterApiUrl('devnet'),
    wsEndpoint: 'wss://psytrbhymqlkfrhudd.dev.genesysgo.net:8900',
    programId: process.env.REACT_APP_DEVNET_PROGRAM_ID,
    serumReferrerIds: {
      E6Z6zLzk8MWY3TY8E87mr88FhGowEPJTeMWzkqtL6qkF: new PublicKey(
        '4wpxNqqAqLtZscg1VZWnnBTQnzJSc42HtSitjpLfm3jz',
      ),
    },
  },
  {
    name: ClusterName.testnet,
    url: clusterApiUrl('testnet'),
    fallbackUrl: clusterApiUrl('testnet'),
    programId: process.env.REACT_APP_TESTNET_PROGRAM_ID,
    serumReferrerIds: {},
  },
  {
    name: ClusterName.localhost,
    url: 'http://127.0.0.1:8899',
    fallbackUrl: 'http://127.0.0.1:8899',
    programId: process.env.REACT_APP_LOCAL_PROGRAM_ID,
    serumReferrerIds: {},
  },
];

export const getReferralId = async (
  program: Program,
  endpoint: Network,
  quoteAssetMint: PublicKey,
): Promise<PublicKey> => {
  // Check if this lookup has already been done
  const codedOrCachedKey = endpoint.serumReferrerIds[quoteAssetMint.toString()];
  if (codedOrCachedKey) return codedOrCachedKey;

  // Get the associated address for a referral
  const owner = new PublicKey(FEE_OWNER_KEY);
  const associatedAddress = await SPLToken.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    quoteAssetMint,
    owner,
  );
  const accountInfo = await program.provider.connection.getAccountInfo(
    associatedAddress,
  );
  if (!accountInfo) {
    throw new Error(
      `Referral account does not exist for ${quoteAssetMint.toString()}. Please create one.`,
    );
  }
  endpoint.serumReferrerIds[quoteAssetMint.toString()] = associatedAddress;
  return associatedAddress;
};

const getDexProgramKeyByNetwork = (name: ClusterName) => {
  switch (name) {
    case 'Mainnet':
      // TODO Don't rely on the markets for this
      return MARKETS.find(({ deprecated }) => !deprecated)?.programId;
    case 'Devnet':
      return new PublicKey(process.env.REACT_APP_DEVNET_DEX_PROGRAM_ID ?? '');
    case 'Testnet':
      // NOTE THIS WILL NOT WORK BECUASE THERE IS NO SERUM DEX DEPLOYED TO TESTNET
      return new PublicKey(process.env.REACT_APP_TESTNET_DEX_PROGRAM_ID ?? '');
    case 'localhost':
      // TODO fix this when we can work through the issues with Serum locally
      // NOTE THIS WILL NOT WORK LOCALLY (fix the commented out section)
      // const serumDexKeyBuffer = fs.readFileSync(ScriptHelpers.serumDexProgramKeypair);
      // const dexProgramAccount = new Account(JSON.parse(serumDexKeyBuffer));
      // const dexProgramId = dexProgramAccount.publicKey;
      return new PublicKey(process.env.REACT_APP_LOCAL_DEX_PROGRAM_ID ?? '');
    default:
      return undefined;
  }
};

const getGraphQLUrlByNetwork = (name: ClusterName) => {
  switch (name) {
    case 'Mainnet':
      return 'https://api.psyoptions.io/v1/graphql';
    case 'Devnet':
      return 'https://devnet-api.psyoptions.io/v1/graphql';
    case 'Testnet':
      return '';
    case 'localhost':
      return 'http://localhost:8080/v1/graphql';
    default:
      return undefined;
  }
};

const getSerumMarketsByNetwork = (name: ClusterName) => {
  switch (name) {
    case networks[0].name:
      return TOKENS.mainnet;
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
      ];
    case networks[2].name:
      return TOKENS.testnet;
    case networks[3].name:
      return [];
    default:
      return [];
  }
};

const getSupportedMarketsByNetwork = (name: ClusterName) => {
  switch (name) {
    case ClusterName.mainnet:
      return MarketMeta.mainnet.optionMarkets;
    case ClusterName.devnet:
      return MarketMeta.devnet.optionMarkets;
    case ClusterName.testnet:
      return MarketMeta.testnet.optionMarkets;
    case ClusterName.localhost:
      return [];
    default:
      return [];
  }
};

const getAssetsByNetwork = (name: ClusterName): Token[] => {
  switch (name) {
    case ClusterName.mainnet:
      return MarketMeta.mainnet.tokens;
    case ClusterName.devnet:
      // Devnet tokens and faucets can be found [here](https://github.com/blockworks-foundation/mango-client-ts/blob/main/src/ids.json#L10)
      return MarketMeta.devnet.tokens;
    case ClusterName.testnet:
      return MarketMeta.testnet.tokens;
    case ClusterName.localhost:
      try {
        /* eslint-disable */
        const localnetData = require('../../tmp/localnetData.json');
        return [TOKENS.mainnet[0], ...localnetData];
      } catch (err) {
        console.error('localnet data not found at ../../tmp/localnetData.json');
        return [];
      }
    default:
      return [];
  }
};

export {
  getAssetsByNetwork,
  getDexProgramKeyByNetwork,
  getGraphQLUrlByNetwork,
  getSupportedMarketsByNetwork,
  getSerumMarketsByNetwork,
  networks,
};
