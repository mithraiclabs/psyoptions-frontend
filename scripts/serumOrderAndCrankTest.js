import { Connection, PublicKey } from '@solana/web3.js';
import { getAssetsByNetwork, getSerumMarketsByNetwork } from '../src/utils/networkInfo';
import { Market } from '@project-serum/serum';
import { SerumMarket } from '../src/utils/serum';

const connection = new Connection('https://devnet.solana.com');
const dexProgramKey = new PublicKey('9MVDeYQnJmN2Dt7H44Z8cob4bET2ysdNu2uFJcatDJno');

const tokenA = {
  "tokenSymbol": "PSYA",
  "mintAddress": "2ShyNZqKffdYKMV6Pm8Ypcxj8GQwvFiAUkfTiyxq9v42",
  "tokenName": "PSYA Test",
  "icon": "https://raw.githubusercontent.com/trustwallet/assets/08d734b5e6ec95227dc50efef3a9cdfea4c398a1/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png"
};

const tokenB = {
  "tokenSymbol": "PSYB",
  "mintAddress": "HinfVnJuzMtJsyuLE2ArYCChDZB6FCxEu2p3CQeMcDiF",
  "tokenName": "PSYB Test",
  "icon": "https://raw.githubusercontent.com/trustwallet/assets/08d734b5e6ec95227dc50efef3a9cdfea4c398a1/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png"
}

const serumMarketMeta = {
  baseAssetMint: '2ShyNZqKffdYKMV6Pm8Ypcxj8GQwvFiAUkfTiyxq9v42',
  quoteAssetMint: 'HinfVnJuzMtJsyuLE2ArYCChDZB6FCxEu2p3CQeMcDiF',
  marketAddress: 'ChLBxZL8RjQ2DhyrZakuTN9nPNjQn23sN7k2fPsSGxuu'
};


(async () => {
  const market = new SerumMarket(connection, new PublicKey(serumMarketMeta.marketAddress), dexProgramKey);
  await market.initMarket();

  console.log('*** MARKET', market.market);
})();

