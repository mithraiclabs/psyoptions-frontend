import { 
  Account,
  Connection, 
  PublicKey, 
  sendAndConfirmTransaction, 
} from '@solana/web3.js';
import { getSolanaConfig } from './helpers';
import { SerumMarket } from '../src/utils/serum';
import { getDexProgramKeyByNetwork } from '../src/utils/networkInfo';
require('../src/config')

const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs');

const connection = new Connection('https://api.devnet.solana.com');
const solanaConfig = getSolanaConfig();
const keyBuffer = fs.readFileSync(solanaConfig.keypair_path);
const wallet = new Account(JSON.parse(keyBuffer));

(async () => {
  if (!argv.marketAddress) {
    console.log('Please include arguments --marketAddress\n');
    process.exit(1);
  }
  const dexProgramKey = getDexProgramKeyByNetwork('Devnet');
  const marketKey = new PublicKey(argv.marketAddress);
  const market = new SerumMarket(connection, marketKey, dexProgramKey);
  await market.initMarket();

  const bidOrderbook = await market.market.loadBids(connection);
  const askOrderbook = await market.market.loadAsks(connection);
  console.log('*** OrderBooks', bidOrderbook.getL2(1), askOrderbook.getL2(1));

  console.log('\n!!!Turning the crank!!!!\n')
  await market.market.matchOrders(connection, wallet, 10);

  const bidOrderbook2 = await market.market.loadBids(connection);
  const askOrderbook2 = await market.market.loadAsks(connection);
  console.log('*** OrderBooks after crank', bidOrderbook2.getL2(1), askOrderbook2.getL2(1));


  const walletOrders = await market.market.loadOrdersForOwner(connection, wallet.publicKey, 0);
  console.log('*** walletOrders', walletOrders)

})();

