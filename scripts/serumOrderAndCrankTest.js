import { 
  Account,
  Connection, 
  PublicKey, 
  sendAndConfirmTransaction, 
} from '@solana/web3.js';
import { getSolanaConfig } from './helpers';
import { SerumMarket } from '../src/utils/serum';

const fs = require('fs');

const connection = new Connection('https://devnet.solana.com');
const dexProgramKey = new PublicKey('9MVDeYQnJmN2Dt7H44Z8cob4bET2ysdNu2uFJcatDJno');
const solanaConfig = getSolanaConfig();
const keyBuffer = fs.readFileSync(solanaConfig.keypair_path);
const wallet = new Account(JSON.parse(keyBuffer));
const ownedTokenAKey = new PublicKey('F2Cz3kTByn7QVFx5hHJLXXeiRiKPtzKGh29tBSttnAKt');
const ownedTokenBKey = new PublicKey('77FbwQ8fJu4CBhWXseZzowztGMEeSY5d1Pbe7yhKJkqW')

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

// When a new order is placed it is put into a specified openOrders account. If one is 
//  not passed when placing an order a new account will be created. We should always use
//  the same one so we can crank the orders after.
const openOrdersAddress = new PublicKey('fTVWuKfcAQg7aHhSprXKFucXB2AQuUCY5u8xzoTgYmT');

(async () => {
  const market = new SerumMarket(connection, new PublicKey(serumMarketMeta.marketAddress), dexProgramKey);
  await market.initMarket();

  const bidOrderbook = await market.market.loadBids(connection);
  const askOrderbook = await market.market.loadAsks(connection);
  console.log('*** OrderBooks', bidOrderbook.getL2(1), askOrderbook.getL2(1));

  // place an order
  console.log('\nPlacing sell order\n');
  await market.placeOrder(connection, {
    owner: wallet,
    payer: ownedTokenAKey,
    side: 'sell',
    price: 2,
    size: 10,
    orderType: 'limit',
    clientId: undefined,
    openOrdersAddressKey: openOrdersAddress,
    feeDiscountPubkey: undefined
  })

  console.log('\nPlacing bid order\n');
  await market.placeOrder(connection, {
    owner: wallet,
    payer: ownedTokenBKey,
    side: 'buy',
    price: 1,
    size: 10,
    orderType: 'limit',
    clientId: undefined,
    openOrdersAddressKey: openOrdersAddress,
    feeDiscountPubkey: undefined
  })

  console.log('\n!!!Turning the crank!!!!\n')
  await market.market.matchOrders(connection, wallet, 10);
  await market.consumeEvents(wallet, [openOrdersAddress], 10, dexProgramKey);

  const bidOrderbook2 = await market.market.loadBids(connection);
  const askOrderbook2 = await market.market.loadAsks(connection);
  console.log('*** OrderBooks after crank', bidOrderbook2.getL2(1), askOrderbook2.getL2(1));


  const walletOrders = await market.market.loadOrdersForOwner(connection, wallet.publicKey, 0);
  console.log('*** walletOrders', walletOrders)

})();

