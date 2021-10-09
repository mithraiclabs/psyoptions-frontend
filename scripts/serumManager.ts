/*
 * The following CLI interface allows for easy creation of a new Serum marker given two mints
 *
 */
import { DexInstructions, Market, OpenOrders } from '@mithraic-labs/serum';
import {
  Account,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Signer,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import * as yargs from 'yargs';
import * as fs from 'fs';

import { getSolanaConfig } from './helpers';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { BN } from '@project-serum/anchor';

/**
 * Handler that creates a new Serum Spot Market for the specified tokens
 *
 * @param connection
 * @param dexProgramId
 * @param baseMint
 * @param quoteMint
 * @param payer
 */
const createSpotMarket = async (
  connection: Connection,
  dexProgramId: PublicKey,
  baseMint: PublicKey,
  quoteMint: PublicKey,
  payer: Keypair,
  marketOpts: {
    baseLotSize: BN;
    quoteLotSize: BN;
    quoteDustThreshold: BN;
    feeRateBps: number;
  },
) => {
  console.log('*** payer', payer.publicKey.toString());
  const tokenProgramId = TOKEN_PROGRAM_ID;
  const market = new Keypair();
  const requestQueue = new Keypair();
  const eventQueue = new Keypair();
  const bids = new Keypair();
  const asks = new Keypair();
  const baseVault = new Keypair();
  const quoteVault = new Keypair();
  const { baseLotSize, quoteLotSize, quoteDustThreshold, feeRateBps } =
    marketOpts;

  async function getVaultOwnerAndNonce(): Promise<[PublicKey, BN]> {
    const nonce = new BN(0);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const vaultOwner = await PublicKey.createProgramAddress(
          [market.publicKey.toBuffer(), nonce.toArrayLike(Buffer, 'le', 8)],
          dexProgramId,
        );
        return [vaultOwner, nonce];
      } catch (e) {
        nonce.iaddn(1);
      }
    }
  }

  const [vaultOwner, vaultSignerNonce] = await getVaultOwnerAndNonce();

  const tx1 = new Transaction();
  // Create an initialize the pool accounts to hold the base and the quote assess
  const poolSize = 165;
  const poolCostLamports = await connection.getMinimumBalanceForRentExemption(
    poolSize,
  );

  tx1.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: baseVault.publicKey,
      lamports: poolCostLamports,
      space: poolSize,
      programId: tokenProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: quoteVault.publicKey,
      lamports: poolCostLamports,
      space: poolSize,
      programId: tokenProgramId,
    }),
    Token.createInitAccountInstruction(
      tokenProgramId,
      baseMint,
      baseVault.publicKey,
      vaultOwner,
    ),
    Token.createInitAccountInstruction(
      tokenProgramId,
      quoteMint,
      quoteVault.publicKey,
      vaultOwner,
    ),
  );

  const tx2 = new Transaction();
  tx2.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: market.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        Market.getLayout(dexProgramId).span,
      ),
      space: Market.getLayout(dexProgramId).span,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: requestQueue.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(5120 + 12),
      space: 5120 + 12,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: eventQueue.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(262144 + 12),
      space: 262144 + 12,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: bids.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(65536 + 12),
      space: 65536 + 12,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: asks.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(65536 + 12),
      space: 65536 + 12,
      programId: dexProgramId,
    }),
    DexInstructions.initializeMarket({
      market: market.publicKey,
      requestQueue: requestQueue.publicKey,
      eventQueue: eventQueue.publicKey,
      bids: bids.publicKey,
      asks: asks.publicKey,
      baseVault: baseVault.publicKey,
      quoteVault: quoteVault.publicKey,
      baseMint,
      quoteMint,
      baseLotSize,
      quoteLotSize,
      feeRateBps,
      vaultSignerNonce,
      quoteDustThreshold,
      programId: dexProgramId,
    }),
  );

  console.log('sending TX 1 ...');
  const txId1 = await sendAndConfirmTransaction(
    connection,
    tx1,
    [payer, baseVault, quoteVault],
    {
      commitment: 'confirmed',
    },
  );
  console.log(`TX ${txId1} confirmed`);

  console.log('sending TX 2');
  const txId2 = await sendAndConfirmTransaction(
    connection,
    tx2,
    [payer, market, requestQueue, eventQueue, bids, asks],
    { commitment: 'confirmed' },
  );
  console.log(`TX ${txId2} confirmed`);

  console.log(`Market Id: ${market.publicKey}`);
};

const createConnection = () => new Connection(yargs.argv['rpc-url'] as string);

const getDexId = () => new PublicKey(yargs.argv['dex-program-id']);

const getBaseMint = () => new PublicKey(yargs.argv['base-mint']);

const getQuoteMint = () => new PublicKey(yargs.argv['quote-mint']);

const getMarketAddress = () => new PublicKey(yargs.argv['market-address']);

const getMidpoint = () => new BN(yargs.argv['midpoint'] as string);

const getClientId = () => new BN(yargs.argv['client-id'] as string);

const getBaseLotSize = () =>
  yargs.argv['base-lot-size']
    ? new BN(yargs.argv['base-lot-size'] as string)
    : new BN('10000');

const getQuoteLotSize = () =>
  yargs.argv['quote-lot-size']
    ? new BN(yargs.argv['quote-lot-size'] as string)
    : new BN('10000');

const getFeeRate = () =>
  yargs.argv['fee-rate'] ? parseInt(yargs.argv['fee-rate'] as string) : 0;

const getQuoteDustThreshold = () =>
  yargs.argv['quote-dust-threshold']
    ? new BN(yargs.argv['quote-dust-threshold'] as string)
    : new BN(100);

/**
 * Get the default keypair from the Solana CLI config file
 * @returns {Keypair}
 */
const getPayer = () => {
  const solanaConfig = getSolanaConfig();
  const keyBuffer = fs.readFileSync(solanaConfig.keypair_path, 'utf-8');
  return Keypair.fromSecretKey(Buffer.from(JSON.parse(keyBuffer)));
};

const readOrderBook = async (
  connection: Connection,
  dexProgramId: PublicKey,
  marketAddress: PublicKey,
) => {
  const market = await Market.load(connection, marketAddress, {}, dexProgramId);
  const asks = await market.loadAsks(connection);
  const bids = await market.loadBids(connection);
  console.log(`bids: ${bids.getL2(5)}\nasks: ${asks.getL2(5)}`);
};

const clientId = new BN('1');

// TODO: add command to cancel all orders

const placeOrderInstruction = (
  dexProgramId: PublicKey,
  market: Market,
  ownerAddress: PublicKey,
  payer: PublicKey,
  price: number,
  size: number,
  side: 'buy' | 'sell',
  openOrdersAddress: PublicKey,
) =>
  DexInstructions.newOrderV3({
    market: market.address,
    // @ts-ignore
    bids: market._decoded.bids,
    // @ts-ignore
    asks: market._decoded.asks,
    // @ts-ignore
    requestQueue: market._decoded.requestQueue,
    // @ts-ignore
    eventQueue: market._decoded.eventQueue,
    // @ts-ignore
    baseVault: market._decoded.baseVault,
    // @ts-ignore
    quoteVault: market._decoded.quoteVault,
    // @ts-ignore
    openOrders: openOrdersAddress,
    owner: ownerAddress,
    payer,
    side,
    limitPrice: market.priceNumberToLots(price),
    maxBaseQuantity: market.baseSizeNumberToLots(size),
    // @ts-ignore
    maxQuoteQuantity: new BN(market._decoded.quoteLotSize.toNumber()).mul(
      market.baseSizeNumberToLots(size).mul(market.priceNumberToLots(price)),
    ),
    orderType: 'limit',
    clientId: new BN(1),
    programId: dexProgramId,
    selfTradeBehavior: 'decrementTake',
    feeDiscountPubkey: null,
  });

/**
 *
 * Rebalance the order book around the midpoint
 *
 * @param connection
 * @param dexProgramId
 * @param marketAddress
 * @param payer
 * @param midpoint - The midpoint where the orders should be spread around
 */
const placeTwoSidedOrders = async (
  connection: Connection,
  dexProgramId: PublicKey,
  marketAddress: PublicKey,
  payer: Keypair,
  midpoint: BN,
) => {
  const transaction = new Transaction();
  const signers: Signer[] = [];
  const market = await Market.load(connection, marketAddress, {}, dexProgramId);

  const ownerAddress = payer.publicKey;
  const spread = 100;
  const topbid = midpoint.subn(spread / 2);
  const bottomAsk = midpoint.addn(spread / 2);

  // Get the open orders accounts for the owner
  const openOrdersAccounts = await market.findOpenOrdersAccountsForOwner(
    connection,
    payer.publicKey,
    0,
  );
  let openOrdersAddress: PublicKey;
  if (openOrdersAccounts.length === 0) {
    let account = new Keypair();
    transaction.add(
      await OpenOrders.makeCreateAccountTransaction(
        connection,
        market.address,
        payer.publicKey,
        account.publicKey,
        dexProgramId,
      ),
    );
    openOrdersAddress = account.publicKey;
    signers.push(account);
    // refresh the cache of open order accounts on next fetch
    // @ts-ignore
    market._openOrdersAccountsCache[ownerAddress.toBase58()].ts = 0;
  } else {
    openOrdersAddress = openOrdersAccounts[0].address;
  }

  // place single bid below midpoint
  const quoteAccount = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    market.quoteMintAddress,
    payer.publicKey,
  );

  transaction.add(
    placeOrderInstruction(
      dexProgramId,
      market,
      payer.publicKey,
      quoteAccount,
      topbid.toNumber(),
      10,
      'buy',
      openOrdersAddress,
    ),
  );

  // place singl ask above the midpoint
  const baseAccount = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    market.baseMintAddress,
    payer.publicKey,
  );
  transaction.add(
    placeOrderInstruction(
      dexProgramId,
      market,
      payer.publicKey,
      baseAccount,
      bottomAsk.toNumber(),
      10,
      'sell',
      openOrdersAddress,
    ),
  );
  console.log('placing orders tx ...');
  const txId = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, ...signers],
    {
      commitment: 'confirmed',
    },
  );
  console.log(`confirmed tx id: ${txId}`);
};

const cancelByClientId = async (
  connection: Connection,
  marketAddress: PublicKey,
  dexProgramId: PublicKey,
  cancelClientId: BN,
  payer: Keypair,
) => {
  const market = await Market.load(connection, marketAddress, {}, dexProgramId);

  const openOrdersAccounts = await market.findOpenOrdersAccountsForOwner(
    connection,
    payer.publicKey,
    0,
  );
  const openOrdersAccount = openOrdersAccounts[0]
    ? openOrdersAccounts[0].address
    : null;
  if (openOrdersAccount) {
    const ix = await market.cancelOrderByClientId(
      connection,
      payer as unknown as Account,
      openOrdersAccount,
      cancelClientId,
    );
  } else {
    console.error(
      `Could not find OpenOrders account for owner ${payer.publicKey.toString()}`,
    );
  }
};

yargs
  .command(
    'create',
    'Create a new Serum Market for the mints.\n Example: \n' +
      `yarn serum create \
    --base-mint So11111111111111111111111111111111111111112 \
    --quote-mint E6Z6zLzk8MWY3TY8E87mr88FhGowEPJTeMWzkqtL6qkF \
    --base-lot-size 10000 \
    --quote-lot-size 10000 \
    --fee-rate 0 \
    --quote-dust-threshold 100`,
    (yargs) =>
      yargs
        .option('rpc-url', {
          type: 'string',
          description: 'Solana RPC url',
          default: 'http://localhost:8899',
        })
        .option('dex-program-id', {
          alias: 'serum-id',
          type: 'string',
          description: 'The Serum program ID',
          default: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
        })
        .option('base-mint', {
          alias: 'base',
          type: 'string',
          description: 'The base mint for the serum market',
          requiresArg: true,
        })
        .option('quote-mint', {
          alias: 'quote',
          type: 'string',
          description: 'The serum market id',
          requiresArg: true,
        })
        .option('base-lot-size', {
          type: 'string',
          description: "The base asset's lot size",
          requiresArg: false,
        })
        .option('quote-lot-size', {
          type: 'string',
          description: "The quote asset's lot size",
        })
        .option('fee-rate', {
          type: 'string',
          description: 'The fee rate in bps',
        })
        .option('quote-dust-threshold', {
          type: 'string',
          description: 'The price currency dust threshold',
        }),
    async (argv) => {
      console.log('***** call back');
      await createSpotMarket(
        createConnection(),
        getDexId(),
        getBaseMint(),
        getQuoteMint(),
        getPayer(),
        {
          baseLotSize: getBaseLotSize(),
          quoteLotSize: getQuoteLotSize(),
          feeRateBps: getFeeRate(),
          quoteDustThreshold: getQuoteDustThreshold(),
        },
      );
    },
  )
  .command(
    'read',
    'Read the order book for a serum market. Eaxmple: \n' +
      `yarn serum read --market-address Dzex62QZucacdDCxLcHnptYpCi37S16vWtaXSvwFPRcH`,
    (yargs) =>
      yargs
        .option('rpc-url', {
          type: 'string',
          description: 'Solana RPC url',
          default: 'http://localhost:8899',
        })
        .option('dex-program-id', {
          alias: 'serum-id',
          type: 'string',
          description: 'The Serum program ID',
          default: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
        })
        .option('market-address', {
          type: 'string',
          desciption: 'The addressof the serum market to read from',
          requiresArg: true,
        }),
    async () => {
      const marketAddress = getMarketAddress();
      console.log(`Reading serum market ${marketAddress}`);
      await readOrderBook(createConnection(), getDexId(), getMarketAddress());
    },
  )
  .command(
    'placeOrders',
    'Place orders on the order book for a serum market. Eaxmple: \n' +
      `yarn serum placeOrders --market-address Dzex62QZucacdDCxLcHnptYpCi37S16vWtaXSvwFPRcH --midpoint 50000`,
    (yargs) =>
      yargs
        .option('rpc-url', {
          type: 'string',
          description: 'Solana RPC url',
          default: 'http://localhost:8899',
        })
        .option('dex-program-id', {
          alias: 'serum-id',
          type: 'string',
          description: 'The Serum program ID',
          default: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
        })
        .option('market-address', {
          type: 'string',
          desciption: 'The addressof the serum market to read from',
          requiresArg: true,
        })
        .option('midpoint', {
          type: 'string',
          desciption: 'The midpoint for the orders',
          requiresArg: true,
        }),
    async () => {
      const marketAddress = getMarketAddress();
      console.log(`Reading serum market ${marketAddress}`);
      await placeTwoSidedOrders(
        createConnection(),
        getDexId(),
        getMarketAddress(),
        getPayer(),
        getMidpoint(),
      );
    },
  )
  .command(
    'cancelOrders',
    'Cancel all orders for client id Eaxmple: \n' +
      `yarn serum cancelOrders --market-address Dzex62QZucacdDCxLcHnptYpCi37S16vWtaXSvwFPRcH --client-id 1`,
    (yargs) =>
      yargs
        .option('rpc-url', {
          type: 'string',
          description: 'Solana RPC url',
          default: 'http://localhost:8899',
        })
        .option('dex-program-id', {
          alias: 'serum-id',
          type: 'string',
          description: 'The Serum program ID',
          default: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
        })
        .option('market-address', {
          type: 'string',
          desciption: 'The addressof the serum market to read from',
          requiresArg: true,
        })
        .option('client-id', {
          type: 'string',
          desciption: 'The client id of the orders to cancel',
          requiresArg: false,
        }),
    async () => {
      const marketAddress = getMarketAddress();
      const cancelId = getClientId() || clientId;
      console.log(
        `Canceling orders for market ${marketAddress} and client id ${cancelId}`,
      );
      await cancelByClientId(
        createConnection(),
        marketAddress,
        getDexId(),
        cancelId,
        getPayer(),
      );
    },
  ).argv;
