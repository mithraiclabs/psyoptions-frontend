/**
 * TODO Create 4 CALL and 4 PUT markets for the Friday ending this month
 * TODO Initialize Serum markets for them
 * TODO seed some bids and asks with some random accounts
 */
import dotenv from 'dotenv';
import * as anchor from '@project-serum/anchor';
import {
  instructions,
  OptionMarket,
  OptionMarketWithKey,
} from '@mithraic-labs/psy-american';
import { Keypair, PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import * as fs from 'fs';
import moment from 'moment';

import { createMinter, getSolanaConfig } from './helpers';
import { getLastFridayOfMonths } from '../src/utils/dates';
import { getAssetsByNetwork } from '../src/utils/networkInfo';
import { ClusterName } from '../src/types';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN, ProgramAccount } from '@project-serum/anchor';
dotenv.config();

(async () => {
  console.log('*** running seedLocalChain');
  const solanaConfig = getSolanaConfig();
  process.env.ANCHOR_WALLET = solanaConfig.keypair_path;
  // Get the default keypair
  const payer = Keypair.fromSecretKey(
    Buffer.from(
      JSON.parse(
        require('fs').readFileSync(process.env.ANCHOR_WALLET, {
          encoding: 'utf-8',
        }),
      ),
    ),
  );
  const provider = anchor.Provider.local();
  const connection = provider.connection;

  const dexProgramId = new PublicKey(
    process.env.NEXT_PUBLIC_LOCAL_DEX_PROGRAM_ID,
  );

  const idlPath = `${process.env.OPTIONS_REPO}/target/idl/psy_american.json`;
  const psyAmericanIdl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
  const programId = new anchor.web3.PublicKey(
    process.env.NEXT_PUBLIC_LOCAL_PROGRAM_ID,
  );

  const program = new anchor.Program(psyAmericanIdl, programId, provider);
  // create markets for the end of the current month,
  // end of next month if last friday on this month passed
  const expirationDate = getLastFridayOfMonths(1)[0]
    ? getLastFridayOfMonths(1)[0]
    : getLastFridayOfMonths(2)[0];
  // We have to divide the JS timestamp by 1,000 to get the timestamp in miliseconds
  const expirationUnixTimestamp = expirationDate.unix();
  const assets = getAssetsByNetwork(ClusterName.localhost);
  const btc = assets.find((asset) => asset.tokenSymbol.match('BTC'));
  const usdc = assets.find((asset) => asset.tokenSymbol.match('USDC'));
  const btcKey = new PublicKey(btc.mintAddress);
  const usdcKey = new PublicKey(usdc.mintAddress);
  const usdcToken = new Token(connection, usdcKey, TOKEN_PROGRAM_ID, payer);
  const btcToken = new Token(connection, btcKey, TOKEN_PROGRAM_ID, payer);
  const wholeBtcPerContract = 0.01;
  const underlyingAmountPerContract = new BigNumber(
    wholeBtcPerContract,
  ).multipliedBy(new BigNumber(10).pow(btc.decimals));
  const quoteAssetPerContract = new BigNumber(
    35_000 * wholeBtcPerContract,
  ).multipliedBy(new BigNumber(10).pow(usdc.decimals));

  console.log(
    '*** initializing market with params',
    underlyingAmountPerContract.toString(),
    quoteAssetPerContract.toString(),
    btcKey.toString(),
    usdcKey.toString(),
    expirationUnixTimestamp,
  );

  const { optionMarketKey } = await instructions.initializeMarket(program, {
    expirationUnixTimestamp: new anchor.BN(expirationUnixTimestamp),
    quoteAmountPerContract: new anchor.BN(quoteAssetPerContract.toNumber()),
    quoteMint: usdcToken.publicKey,
    underlyingAmountPerContract: new anchor.BN(
      underlyingAmountPerContract.toNumber(),
    ),
    underlyingMint: btcToken.publicKey,
  });

  console.log(`*** created option: ${optionMarketKey}`);

  // create and drop a WriterToken who's market expired
  const { optionMarketKey: expiringOptionKey } =
    await instructions.initializeMarket(program, {
      // Market expires in 10 seconds
      expirationUnixTimestamp: new anchor.BN(new Date().getTime() / 1000 + 10),
      quoteAmountPerContract: new anchor.BN(quoteAssetPerContract.toNumber()),
      quoteMint: usdcToken.publicKey,
      underlyingAmountPerContract: new anchor.BN(
        underlyingAmountPerContract.toNumber(),
      ),
      underlyingMint: btcToken.publicKey,
    });

  console.log(`*** created expiring option market: ${optionMarketKey}`);

  let tmp = await program.account.optionMarket.fetch(expiringOptionKey);
  const expiringOptionMarket = {
    ...tmp,
    key: expiringOptionKey,
  } as OptionMarketWithKey;

  console.log(
    'expiringOptionMarket',
    expiringOptionMarket,
    typeof expiringOptionMarket,
    Object.keys(expiringOptionMarket),
  );

  const expiringOptionsToMint = 5;
  const {
    optionAssociatedAddress,
    quoteAssociatedAddress,
    underlyingAssociatedAddress,
    writerAssociatedAddress,
  } = await createMinter(
    provider.connection,
    payer,
    payer,
    btcToken,
    underlyingAmountPerContract
      .multipliedBy(expiringOptionsToMint * 2)
      .toNumber(),
    expiringOptionMarket.optionMint,
    expiringOptionMarket.writerTokenMint,
    usdcToken,
  );
  console.log('*** created minter, now minting...');
  await instructions.mintOptionsTx(
    program,
    optionAssociatedAddress,
    writerAssociatedAddress,
    underlyingAssociatedAddress,
    new BN(expiringOptionsToMint),
    expiringOptionMarket,
  );

  const expiringWriterTokens = new Token(
    provider.connection,
    expiringOptionMarket.writerTokenMint,
    TOKEN_PROGRAM_ID,
    payer,
  );
  // create associated token address for wallet
  const walletExpiringWriterTokenAcct =
    await expiringWriterTokens.getOrCreateAssociatedAccountInfo(
      new PublicKey(process.env.WALLET_ADDRESS),
    );

  expiringWriterTokens.transfer(
    writerAssociatedAddress,
    walletExpiringWriterTokenAcct.address,
    payer,
    [],
    expiringOptionsToMint,
  );

  console.log('*** creating serum market');
  // create a Serum market for these options (so they show up in the local UI for now)
  await instructions.initializeSerumMarket(program, {
    optionMarketKey: expiringOptionMarket.key,
    optionMint: expiringOptionMarket.optionMint,
    pcDustThreshold: new BN(100),
    pcLotSize: new BN(0.01 * 10 * usdc.decimals),
    pcMint: usdcToken.publicKey,
    serumProgramKey: dexProgramId,
  });
})();
