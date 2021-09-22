import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

const yaml = require('js-yaml');
const os = require('os');
const fs = require('fs');

export const serumDexProgramKeypair = './serum/dex/serum_dex-keypair.json';
export const serumDexBinaryPath = './serum/dex/serum_dex.so';

export const wait = (delayMS: number) =>
  new Promise((resolve) => setTimeout(resolve, delayMS));

export const getSolanaConfig = () => {
  // Read the default key file
  const HOME = os.homedir();
  const configYml = fs.readFileSync(
    `${HOME}/.config/solana/cli/config.yml`,
    'utf-8',
  );
  return yaml.load(configYml);
};

export const validateLocalnet = (solanaConfig) => {
  // Exit if the user is not pointing to local net
  if (!solanaConfig.json_rpc_url.match(/127\.0\.0\.1|localhost/)) {
    console.log(
      "It looks like you're Solana configuration file is not pointed to localnet. Please make sure you are using the correct network and keypair.",
    );
    process.exit(1);
  }
};

export const requestAndWaitForAirdrop = async (connection, amount, account) => {
  const priorBalance = await connection.getBalance(account.publicKey);
  await connection.requestAirdrop(account.publicKey, amount);
  let retries = 60;
  for (;;) {
    // sleep half a second
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const balance = await connection.getBalance(account.publicKey);
    console.log('account balance ', balance);
    if (amount === balance - priorBalance) {
      return account;
    }
    if (--retries <= 0) {
      throw new Error('Failed to airdrop SOL to payer for seed');
    }
  }
};

export const createMinter = async (
  connection: Connection,
  minter: Keypair,
  mintAuthority: Keypair,
  underlyingToken: Token,
  underlyingAmount: number,
  optionMint: PublicKey,
  writerTokenMint: PublicKey,
  quoteToken: Token,
  quoteAmount: number = 0,
) => {
  const transaction = new Transaction();

  const underlyingAssociatedAddress = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    underlyingToken.publicKey,
    minter.publicKey,
  );
  transaction.add(
    Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      underlyingToken.publicKey,
      underlyingAssociatedAddress,
      minter.publicKey,
      minter.publicKey,
    ),
  );

  const quoteAssociatedAddress = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    quoteToken.publicKey,
    minter.publicKey,
  );
  transaction.add(
    Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      quoteToken.publicKey,
      quoteAssociatedAddress,
      minter.publicKey,
      minter.publicKey,
    ),
  );

  // create an associated token account to hold the options
  const optionAssociatedAddress = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    optionMint,
    minter.publicKey,
  );
  transaction.add(
    Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      optionMint,
      optionAssociatedAddress,
      minter.publicKey,
      minter.publicKey,
    ),
  );

  // create an associated token account to hold the writer tokens
  const writerAssociatedAddress = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    writerTokenMint,
    minter.publicKey,
  );
  transaction.add(
    Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      writerTokenMint,
      writerAssociatedAddress,
      minter.publicKey,
      minter.publicKey,
    ),
  );

  await sendAndConfirmTransaction(connection, transaction, [minter], {
    commitment: 'confirmed',
  });

  // mint underlying tokens to the minter's account
  await underlyingToken.mintTo(
    underlyingAssociatedAddress,
    mintAuthority,
    [],
    underlyingAmount,
  );

  if (quoteAmount > 0) {
    await quoteToken.mintTo(
      quoteAssociatedAddress,
      mintAuthority,
      [],
      quoteAmount,
    );
  }
  return {
    optionAssociatedAddress,
    quoteAssociatedAddress,
    underlyingAssociatedAddress,
    writerAssociatedAddress,
  };
};

const seedSerumMarket = (marketAddress) => {};
