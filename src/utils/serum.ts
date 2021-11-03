import {
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  Connection,
  Signer,
  AccountInfo,
} from '@solana/web3.js';

import { DexInstructions, Market } from '@mithraic-labs/serum';
import BN from 'bn.js';
import { MintLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Buffer } from 'buffer';

import { MarketOptions, Orderbook } from '@mithraic-labs/serum/lib/market';
import * as Sentry from '@sentry/react';

import type { SerumMarketAndProgramId } from '../types';
import { Order } from '../context/SerumOrderbookContext';
import { chunkArray } from './general';

export const getKeyForMarket = (market: Market): string =>
  market.address.toString();

type AllSerumMarketInfo = {
  market: Market;
  orderbookData: {
    asks: Order[];
    bids: Order[];
    bidOrderbook: Orderbook;
    askOrderbook: Orderbook;
  };
  serumProgramId: string;
};

/**
 * Loads multiple Serum markets with minimal RPC requests
 */
export const batchSerumMarkets = async (
  connection: Connection,
  serumMarketAndProgramIds: SerumMarketAndProgramId[],
  options: MarketOptions = {},
  depth = 10,
): Promise<{
  serumMarketsInfo: AllSerumMarketInfo[];
  orderbookKeys: PublicKey[];
}> => {
  const serumPrograms: Record<string, { addresses: PublicKey[] }> = {};

  serumMarketAndProgramIds.forEach(({ serumMarketKey, serumProgramId }) => {
    if (serumPrograms[serumProgramId]?.addresses) {
      serumPrograms[serumProgramId].addresses.push(serumMarketKey);
    } else {
      serumPrograms[serumProgramId] = {
        addresses: [serumMarketKey],
      };
    }
  });

  // All orderbook keys and serum infos across diff serum programs
  // For now I am going to return them all combined
  // but the ideal architecture later might be to return a key/value map of the seurm program id
  // with the orderobok keys and the info separated by program id
  const allOrderbookKeys: PublicKey[] = [];
  const allSerumMarketsInfo: AllSerumMarketInfo[] = [];

  // This is not 100% optimal still, because it's now broken down into multiple batches by serum program
  // However, I doubt there will ever be more than 2-3 serum program ids max
  // so this should not affect perf too much
  await Promise.all(
    Object.keys(serumPrograms).map(async (key) => {
      const { addresses } = serumPrograms[key];
      const programId = new PublicKey(key);
      // Load all of the MarketState data
      const groupOfAddresses: PublicKey[][] = chunkArray(addresses, 100);
      const getMultipleAccountsForAddresses: Promise<AccountInfo<Buffer>[]>[] = groupOfAddresses.map(addresses => {
        return connection.getMultipleAccountsInfo(addresses);
      });
      const addressesAccounts = await Promise.all(getMultipleAccountsForAddresses);
      const marketInfos: AccountInfo<Buffer>[] = addressesAccounts.flat();
      if (!marketInfos || !marketInfos.length) {
        throw new Error('Markets not found');
      }
      // decode all of the markets
      const decoded = marketInfos.map((accountInfo) =>
        Market.getLayout(programId).decode(accountInfo?.data),
      );

      const mintKeys: PublicKey[] = [];
      const orderbookKeys: PublicKey[] = [];
      let mintInfos: AccountInfo<Buffer>[];
      let orderBookInfos: AccountInfo<Buffer>[];

      try {
        // Load all of the SPL Token Mint data and orderbook data for the markets
        decoded.forEach((d) => {
          mintKeys.push(d.baseMint);
          mintKeys.push(d.quoteMint);
          orderbookKeys.push(d.bids);
          orderbookKeys.push(d.asks);
        });
        const groupOfMintKeys: PublicKey[][] = chunkArray(mintKeys, 100);
        const getMultipleAccountsForMintKeys: Promise<AccountInfo<Buffer>[]>[] = groupOfMintKeys.map(mintKeys => {
          return connection.getMultipleAccountsInfo(mintKeys);
        });
        const mintKeysAccounts = await Promise.all(getMultipleAccountsForMintKeys);
        mintInfos = mintKeysAccounts.flat();

        const groupOfOrderbookKeys: PublicKey[][] = chunkArray(orderbookKeys, 100);
        const getMultipleAccountsForOrderbookKeys: Promise<AccountInfo<Buffer>[]>[] = groupOfOrderbookKeys.map(orderbookKeys => {
          return connection.getMultipleAccountsInfo(orderbookKeys);
        });
        const orderbookKeysAccounts = await Promise.all(getMultipleAccountsForOrderbookKeys);
        orderBookInfos = orderbookKeysAccounts.flat();
      } catch (err) {
        throw new Error('Could not load all of the SPL Token Mint & Orderbook data');
      }

      const mints = mintInfos?.map((mintInfo) =>
        MintLayout.decode(mintInfo?.data),
      );

      // instantiate the many markets
      const serumMarketsInfo = decoded.map((d, index) => {
        const { decimals: baseMintDecimals } = mints?.[index * 2];
        const { decimals: quoteMintDecimals } = mints?.[index * 2 + 1];
        const bidsAccountInfo = orderBookInfos[index * 2];
        const asksAccountInfo = orderBookInfos[index * 2 + 1];
        const market = new Market(
          d,
          baseMintDecimals,
          quoteMintDecimals,
          options,
          programId,
        );
        const bidOrderbook = Orderbook.decode(
          market,
          bidsAccountInfo?.data ?? Buffer.from([]),
        );
        const askOrderbook = Orderbook.decode(
          market,
          asksAccountInfo?.data ?? Buffer.from([]),
        );
        return {
          market,
          orderbookData: {
            asks: askOrderbook
              .getL2(depth)
              .map(([price, size]) => ({ price, size })),
            bids: bidOrderbook
              .getL2(depth)
              .map(([price, size]) => ({ price, size })),
            bidOrderbook,
            askOrderbook,
          },
          serumProgramId: key,
        };
      });

      allOrderbookKeys.push(...orderbookKeys);
      allSerumMarketsInfo.push(...serumMarketsInfo);
    }),
  );

  return {
    serumMarketsInfo: allSerumMarketsInfo,
    orderbookKeys: allOrderbookKeys,
  };
};

/**
 * Returns the first available SerumMarket for specified assets
 *
 * @param {Connect} connection
 * @param {PublicKey} baseMintAddress
 * @param {PublicKey} quoteMintAddress
 * @param {PublicKey} dexProgramKey
 */
export const findMarketByAssets = async (
  connection: Connection,
  baseMintAddress: PublicKey,
  quoteMintAddress: PublicKey,
  dexProgramKey: PublicKey,
): Promise<Market | null> => {
  const availableMarkets = await Market.findAccountsByMints(
    connection,
    baseMintAddress,
    quoteMintAddress,
    dexProgramKey,
  );
  if (availableMarkets.length) {
    return Market.load(
      connection,
      availableMarkets[0].publicKey,
      {},
      dexProgramKey,
    );
  }
  return null;
};

/**
 * Returns full orderbook up to specified depth
 * @param {number} depth
 * @param {number} roundTo -- TODO: merge orderbook rows by rounding the prices to a number of decimals
 * @returns {{ bids[[ price, size ]], asks[[ price, size ]]}}
 */
export const getOrderbook = async (
  connection: Connection,
  market: Market,
  depth = 20,
): Promise<{
  bidOrderbook: Orderbook | null;
  askOrderbook: Orderbook | null;
  bids: Order[];
  asks: Order[];
}> => {
  try {
    const [bidOrderbook, askOrderbook] = await Promise.all([
      market.loadBids(connection),
      market.loadAsks(connection),
    ]);

    return {
      bidOrderbook,
      askOrderbook,
      bids: !bidOrderbook
        ? []
        : bidOrderbook.getL2(depth).map(([price, size]) => ({ price, size })),
      asks: !askOrderbook
        ? []
        : askOrderbook.getL2(depth).map(([price, size]) => ({ price, size })),
    };
  } catch (err) {
    console.error(err);
    Sentry.captureException(err);
  }
  return {
    bidOrderbook: null,
    askOrderbook: null,
    bids: [],
    asks: [],
  };
};

/**
 * Generate the TX to initialize a new market.
 * pulled from https://github.com/project-serum/serum-dex-ui/blob/c6d0da0fc645492800f48a62b3314ebb5eaf2401/src/utils/send.tsx#L473
 *
 * @param {Connection} connection
 * @param {PublicKey} payer
 * @param {PublicKey} baseMint
 * @param {PublicKey} quoteMint
 * @param {BN} baseLotSize
 * @param {BN} quoteLotSize
 * @param {PublicKey} dexProgramId
 */
export const createInitializeMarketTx = async ({
  connection,
  payer,
  baseMint,
  quoteMint,
  baseLotSize,
  quoteLotSize,
  dexProgramId,
}: {
  connection: Connection;
  payer: PublicKey;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  baseLotSize: number;
  quoteLotSize: number;
  dexProgramId: PublicKey;
}): Promise<{
  tx1: Transaction;
  signers1: Signer[];
  tx2: Transaction;
  signers2: Signer[];
  market: Keypair;
}> => {
  const tokenProgramId = TOKEN_PROGRAM_ID;
  const market = new Keypair();
  const requestQueue = new Keypair();
  const eventQueue = new Keypair();
  const bids = new Keypair();
  const asks = new Keypair();
  const baseVault = new Keypair();
  const quoteVault = new Keypair();
  const feeRateBps = 0;
  const quoteDustThreshold = new BN(100);

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
      fromPubkey: payer,
      newAccountPubkey: baseVault.publicKey,
      lamports: poolCostLamports,
      space: poolSize,
      programId: tokenProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer,
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
      fromPubkey: payer,
      newAccountPubkey: market.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        Market.getLayout(dexProgramId).span,
      ),
      space: Market.getLayout(dexProgramId).span,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: requestQueue.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(5120 + 12),
      space: 5120 + 12,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: eventQueue.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(262144 + 12),
      space: 262144 + 12,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: bids.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(65536 + 12),
      space: 65536 + 12,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer,
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

  const { blockhash } = await connection.getRecentBlockhash();
  const signers1 = [baseVault, quoteVault];
  tx1.feePayer = payer;
  tx1.recentBlockhash = blockhash;
  tx1.partialSign(...signers1);
  const signers2 = [market, requestQueue, eventQueue, bids, asks];
  tx2.feePayer = payer;
  tx2.recentBlockhash = blockhash;
  tx2.partialSign(...signers2);
  return {
    tx1,
    signers1,
    tx2,
    signers2,
    market,
  };
};

export class SerumMarket {
  connection: Connection;

  marketAddress: PublicKey;

  dexProgramKey: PublicKey;

  market?: Market;

  constructor(
    connection: Connection,
    marketAddress: PublicKey,
    dexProgramKey: PublicKey,
    market?: Market,
  ) {
    this.connection = connection;
    this.marketAddress = marketAddress;
    this.dexProgramKey = dexProgramKey;
    this.market = market;
  }

  async initMarket(): Promise<void> {
    this.market = await this.getMarket();
  }

  /**
   * Look up a Serum market via the Base and Quote mint addresses.
   * @param {PublicKey} baseMintAddress
   * @param {PublicKey} quoteMintAddress
   * @param {PublicKey} dexProgramId
   */
  static async getMarketByAssetKeys(
    connection: Connection,
    baseMintAddress: PublicKey,
    quoteMintAddress: PublicKey,
    dexProgramId: PublicKey,
  ): Promise<
    {
      publicKey: PublicKey;
      accountInfo: {
        data: Buffer;
        executable: boolean;
        owner: PublicKey;
        lamports: number;
      };
    }[]
  > {
    const filters = [
      {
        memcmp: {
          offset: Market.getLayout(dexProgramId).offsetOf('baseMint'),
          bytes: baseMintAddress.toBase58(),
        },
      },
      {
        memcmp: {
          offset: Market.getLayout(dexProgramId).offsetOf('quoteMint'),
          bytes: quoteMintAddress.toBase58(),
        },
      },
    ];
    const resp = await connection.getProgramAccounts(dexProgramId, {
      commitment: connection.commitment,
      encoding: 'base64',
      filters,
    });
    return resp.map(
      ({ pubkey, account: { data, executable, owner, lamports } }) => ({
        publicKey: pubkey,
        accountInfo: {
          data,
          executable,
          owner,
          lamports,
        },
      }),
    );
  }

  /**
   *
   * @param {Connection} connection
   * @param {PublicKey} marketAddress
   */
  async getMarket(): Promise<Market> {
    return Market.load(
      this.connection,
      this.marketAddress,
      {},
      this.dexProgramKey,
    );
  }

  /**
   * Returns the highest bid price and lowest ask price for a market
   */
  async getBidAskSpread(): Promise<{
    bid: number | null;
    ask: number | null;
  }> {
    if (!this.market) {
      return { bid: null, ask: null };
    }
    const bidOrderbook = await this.market.loadBids(this.connection);
    const askOrderbook = await this.market.loadAsks(this.connection);

    const highestbid = bidOrderbook.getL2(1)[0];
    const lowestAsk = askOrderbook.getL2(1)[0];
    return { bid: highestbid[0], ask: lowestAsk[0] };
  }
}
