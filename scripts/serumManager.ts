/*
 * The following CLI interface allows for easy creation of a new Serum marker given two mints
 *
 */
import { DexInstructions, Market } from '@mithraic-labs/serum';
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import * as yargs from 'yargs';
import * as fs from 'fs';

import { getSolanaConfig } from './helpers';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
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

yargs.command(
  'create',
  'Create a new Serum Market for the mints.\n Example: \n' +
    `yarn serum create \
    --base-mint 3xUcwkfeNFiNbQCicdTxyjKf4mEGy6qHTxJFfZ7bu6nY \
    --quote-mint DjiqEHJtugy7rJNrdLTHe7B972BcV3uRHHjxjKiWVQ9M \
    --base-lot-size 10000 \
    --quote-lot-size 10000 \
    --fee-rate 0 \
    --quote-dust-threshold 100`,
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
  async () => {
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
);

const createConnection = () => new Connection(yargs.argv['rpc-url'] as string);

const getDexId = () => new PublicKey(yargs.argv['dex-program-id']);

const getBaseMint = () => new PublicKey(yargs.argv['base-mint']);

const getQuoteMint = () => new PublicKey(yargs.argv['quote-mint']);

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

console.log('*** yargs', yargs.argv);

// TODO: create | load 1 keypairs for management

// TODO: add command to cancel all orders

// TODO: add command to re-balance the order book
