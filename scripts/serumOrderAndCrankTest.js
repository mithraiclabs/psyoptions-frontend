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


(async () => {
  const market = new SerumMarket(connection, new PublicKey(serumMarketMeta.marketAddress), dexProgramKey);
  await market.initMarket();

  // TODO place an order (or a few) and validate the orders are present
  console.log('\nPlacing order\n');
  // const { transaction, signers } = await market.createPlaceOrderTx(wallet.publicKey, ownedTokenAKey, "sell", 1.50, 10, "limit")
  // await sendAndConfirmTransaction(connection, transaction, [wallet, ...signers], {
  //   skipPreflight: false,
  //   commitment: 'max',
  //   preflightCommitment: 'recent',
  // });

  const res = await market.placeOrder(connection, {
    owner: wallet,
    payer: ownedTokenAKey,
    side: 'sell',
    price: 1.5,
    size: 10,
    orderType: 'limit',
    clientId: undefined,
    openOrdersAddressKey: undefined,
    openOrdersAccount: undefined,
    feeDiscountPubkey: undefined
  })
  console.log('*** placeOrder response = ', res);

  console.log('*** MARKET', market.market)
  const walletOrders = await market.market.loadOrdersForOwner(connection, wallet.publicKey, 0);
  console.log('*** walletOrders', walletOrders)


  // TODO turn the crank for the market ... also figure out how the above placed orders move through the system when the crank is turned
})();

