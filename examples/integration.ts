import {
  instructions,
  OptionMarket,
  OptionMarketWithKey,
  PsyAmericanIdl,
} from '@mithraic-labs/psy-american';
import { MarketMeta } from '@mithraic-labs/market-meta';
import { BN, Program, Provider } from '@project-serum/anchor';
import { NodeWallet } from '@project-serum/anchor/dist/cjs/provider';
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmRawTransaction,
  Signer,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import * as fs from 'fs';
import * as os from 'os';

function readKeypair() {
  return JSON.parse(
    process.env.KEYPAIR ||
      fs.readFileSync(os.homedir() + '/.config/solana/devnet.json', 'utf-8'),
  );
}

// Below we create the Anchor Program from the PsyAmerican IDL,
//  devnet connection, and wallet keypair
const PSY_PROGRAM_ID = new PublicKey(
  'R2y9ip6mxmWUj4pt54jP2hz2dgvMozy9VTSwMWE7evs',
);
const SOL_DECIMALS = 9;
const LAMPORTS_MULTIPLIER = 10 ** SOL_DECIMALS;
const WRAPPED_SOL_MINT = new PublicKey(
  'So11111111111111111111111111111111111111112',
);
const connection = new Connection(
  'https://api.devnet.solana.com',
  'processed' as Commitment,
);
const wallet = new NodeWallet(readKeypair());
const provider = new Provider(connection, wallet, { commitment: 'processed' });
const program = new Program(PsyAmericanIdl, PSY_PROGRAM_ID, provider);

// Filter devnet markets to only unexpired markets
// TODO: Filter for only SOL markets
const activeDevnetMarkets = MarketMeta.devnet.optionMarkets.filter(
  (marketMeta) => marketMeta.expiration * 1000 > new Date().getTime(),
);

// TODO: Provide gist for minting an option
// TODO: Provide example for posting an order to the permissioned markets

/**
 * WSol call option
 */
const EXAMPLE_WSOL_CALL_OPTION = {
  expiration: 1637971199,
  optionMarketAddress: '5Wn8Njt7VsG8cUdY9A63Q7SoJXqv2NCr74EzHcZdbUD5',
  optionContractMintAddress: 'FJR7vH1Yte5Hg7oW7u7LTUHbx5c4oKEZM9xaZnVmpwHd',
  optionWriterTokenMintAddress: 'Gp1b5KZhx9mBC7ACjBxMo5C8yjtSFavjaJSUB1ezEtF8',
  quoteAssetMint: 'E6Z6zLzk8MWY3TY8E87mr88FhGowEPJTeMWzkqtL6qkF',
  quoteAssetPoolAddress: 'n7ip3ZZyLux6b9CXCNNA3BJveZNyWAi5CteUqiCLmH1',
  underlyingAssetMint: 'So11111111111111111111111111111111111111112',
  underlyingAssetPoolAddress: 'Gs27hBYYDEZMxsdLaoGnGVd3nvyBUCMEwNMxsxyX7zN',
  underlyingAssetPerContract: '1000000000',
  quoteAssetPerContract: '30000',
  serumMarketAddress: 'FsEBBfyVUgC92K3hB2GQywv56vsUgYjGgDARoeDLxUyn',
  serumProgramId: 'DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY',
  psyOptionsProgramId: 'R2y9ip6mxmWUj4pt54jP2hz2dgvMozy9VTSwMWE7evs',
};
const optionTokenMint = new PublicKey(
  EXAMPLE_WSOL_CALL_OPTION.optionContractMintAddress,
);
const writerTokenMint = new PublicKey(
  EXAMPLE_WSOL_CALL_OPTION.optionWriterTokenMintAddress,
);

const WrappedSolToken = new Token(
  connection,
  WRAPPED_SOL_MINT,
  TOKEN_PROGRAM_ID,
  wallet.payer,
);
const optionToken = new Token(
  program.provider.connection,
  optionTokenMint,
  TOKEN_PROGRAM_ID,
  null as unknown as Signer,
);
const writerToken = new Token(
  program.provider.connection,
  writerTokenMint,
  TOKEN_PROGRAM_ID,
  null as unknown as Signer,
);
/**
 * Create an account that wraps Sol
 */
const createWSolAccountInstruction = (
  provider: Provider,
  lamports: number,
): [Transaction, Keypair] => {
  const keypair = new Keypair();
  const transaction = new Transaction();
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: keypair.publicKey,
      lamports,
      space: AccountLayout.span,
      programId: TOKEN_PROGRAM_ID,
    }),
  );

  transaction.add(
    Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      WrappedSolToken.publicKey,
      keypair.publicKey,
      wallet.publicKey,
    ),
  );
  return [transaction, keypair];
};

(async () => {
  /**
   * SPL Token rent for exemption in lamports
   */
  const splTokenRentBalance =
    await connection.getMinimumBalanceForRentExemption(AccountLayout.span);

  // Transaction that will contain all instructions to mint WSol option
  const mintTransaction = new Transaction();
  const signers: Signer[] = [];

  // Create WSol account instruction with 5 Sol.
  // To create Wrapped Solana, we must create an account with lamports equal to
  // the amount of Solana we want in the account PLUS the rent exemption amount.
  const [createWSolAccountTx, wSolKeypair] = createWSolAccountInstruction(
    provider,
    splTokenRentBalance + 5 * LAMPORTS_MULTIPLIER,
  );
  mintTransaction.add(createWSolAccountTx);
  signers.push(wSolKeypair);

  // get associate token program address for optiona and writer tokens
  const [optionTokenDest, writerTokenDest] = await Promise.all([
    Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      optionTokenMint,
      wallet.publicKey,
    ),
    Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      writerTokenMint,
      wallet.publicKey,
    ),
  ]);

  // check if the associated accounts exist or add instructions to create them
  try {
    await optionToken.getAccountInfo(optionTokenDest);
  } catch (err) {
    // no account found, generate instruction to create it
    const ix = Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      optionTokenMint,
      optionTokenDest,
      wallet.publicKey,
      wallet.publicKey,
    );
    mintTransaction.add(ix);
  }
  try {
    await writerToken.getAccountInfo(writerTokenDest);
  } catch (err) {
    // no account found, generate instruction to create it
    const ix = Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      writerTokenMint,
      writerTokenDest,
      wallet.publicKey,
      wallet.publicKey,
    );
    mintTransaction.add(ix);
  }
  const option = (await program.account.optionMarket.fetch(
    EXAMPLE_WSOL_CALL_OPTION.optionMarketAddress,
  )) as unknown as OptionMarket;
  const optionWithKey: OptionMarketWithKey = {
    ...option,
    key: new PublicKey(EXAMPLE_WSOL_CALL_OPTION.optionMarketAddress),
  };

  // finally mint the option token
  const { ix, signers: _signers } = await instructions.mintOptionInstruction(
    program,
    optionTokenDest,
    writerTokenDest,
    new PublicKey(EXAMPLE_WSOL_CALL_OPTION.underlyingAssetMint),
    new BN(1),
    optionWithKey,
  );
  mintTransaction.add(ix);
  signers.concat(_signers);

  // Add instructions to close Wrapped Solana account
  const closeWSolIx = Token.createCloseAccountInstruction(
    TOKEN_PROGRAM_ID,
    WRAPPED_SOL_MINT,
    wallet.publicKey, // Send any remaining SOL to the owner
    wallet.publicKey, // payer to close account
    [],
  );
  mintTransaction.add(closeWSolIx);

  // Sign and send transaction
  await mintTransaction.partialSign(...signers, wallet.payer);
  await sendAndConfirmRawTransaction(connection, mintTransaction.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'recent',
    commitment: 'max',
  });
})();
