import {
  feeAmountPerContract,
  instructions,
  OptionMarket,
  OptionMarketWithKey,
  OrderParamsWithFeeRate,
  PsyAmericanIdl,
  serumInstructions,
} from '@mithraic-labs/psy-american';
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
  Signer,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import * as fs from 'fs';
import * as os from 'os';
import { Market } from '@project-serum/serum';
import { Order } from '@project-serum/serum/lib/market';

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
const optionPublicKey = new PublicKey(
  EXAMPLE_WSOL_CALL_OPTION.optionMarketAddress,
);
const optionTokenMint = new PublicKey(
  EXAMPLE_WSOL_CALL_OPTION.optionContractMintAddress,
);
const writerTokenMint = new PublicKey(
  EXAMPLE_WSOL_CALL_OPTION.optionWriterTokenMintAddress,
);
const serumMarketKey = new PublicKey(
  EXAMPLE_WSOL_CALL_OPTION.serumMarketAddress,
);
const quoteAssetMint = new PublicKey(EXAMPLE_WSOL_CALL_OPTION.quoteAssetMint);

const WrappedSolToken = new Token(
  connection,
  WRAPPED_SOL_MINT,
  TOKEN_PROGRAM_ID,
  wallet.payer,
);
// const QuoteAssetToken = new Token(
//   connection,
//   quoteAssetMint,
//   TOKEN_PROGRAM_ID,
//   wallet.payer,
// );
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
  const option = (await program.account.optionMarket.fetch(
    EXAMPLE_WSOL_CALL_OPTION.optionMarketAddress,
  )) as unknown as OptionMarket;
  const optionWithKey: OptionMarketWithKey = {
    ...option,
    key: new PublicKey(EXAMPLE_WSOL_CALL_OPTION.optionMarketAddress),
  };
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
  const numContracts = 1;
  const fees = feeAmountPerContract(option.underlyingAmountPerContract);
  const lamports = option.underlyingAmountPerContract
    .add(fees)
    .mul(new BN(numContracts));
  const [createWSolAccountTx, wSolKeypair] = createWSolAccountInstruction(
    provider,
    splTokenRentBalance + lamports.toNumber(),
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

  // finally mint the option token
  const { ix, signers: _signers } = await instructions.mintOptionInstruction(
    program,
    optionTokenDest,
    writerTokenDest,
    new PublicKey(EXAMPLE_WSOL_CALL_OPTION.underlyingAssetMint),
    new BN(numContracts),
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
  await program.provider.send(mintTransaction, signers);

  /**
   * Now that we have some wSOL OptionTokens, lets read the order book
   */
  // Load the Serum market for the example option market
  const market = await Market.load(
    connection,
    new PublicKey(EXAMPLE_WSOL_CALL_OPTION.serumMarketAddress),
    {},
    new PublicKey(EXAMPLE_WSOL_CALL_OPTION.serumProgramId),
  );

  // Fetch orderbooks
  const bids = await market.loadBids(connection);
  const asks = await market.loadAsks(connection);

  // L2 orderbook data
  for (const [price, size] of bids.getL2(20)) {
    console.log(price, size);
  }

  // L3 orderbook data
  for (const order of asks) {
    console.log(
      order.openOrdersAddress.toBase58(),
      order.orderId.toString('hex'),
      order.price,
      order.size,
      order.side,
    );
  }

  /**
   * Now lets place an order!
   *
   * NOTE: This process can be made more efficient if you derive the
   * OpenOrders address outside of this instruction and ensure it is
   * initialized. If you take a look at [this code block](https://github.com/mithraiclabs/psyoptions-ts/blob/master/packages/psy-american/src/serumInstructions/newOrder.ts#L46-L73)
   * you will notice multiple async functions that could be avoided
   * with each order if OpenOrders information is hoisted out and
   * passed in with the Order.
   */
  const serumProgramId = new PublicKey(EXAMPLE_WSOL_CALL_OPTION.serumProgramId);
  const side = 'sell';
  /**
   * NOTE: For Serum, the payer is the SPL token account required to cover the collateral.
   * Ping @tomjohn1028 on PsyOptions discord :)
   * */
  const payer =
    // @ts-ignore
    side === 'buy'
      ? await Token.getAssociatedTokenAddress(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          market.quoteMintAddress,
          wallet.publicKey,
        )
      : optionTokenDest;
  // #TODO: change this
  const clientId = new BN(1234);
  const order: OrderParamsWithFeeRate<PublicKey> = {
    owner: wallet.publicKey,
    payer,
    side,
    price: 50,
    size: 1,
    orderType: 'limit',
    clientId: new BN(1),
    selfTradeBehavior: 'decrementTake',
    programId: serumProgramId,
  };
  const { openOrdersKey, tx: newOrderTx } =
    await serumInstructions.newOrderInstruction(
      program,
      optionPublicKey,
      serumProgramId,
      serumMarketKey,
      order,
    );
  await program.provider.send(newOrderTx);

  /**
   * We no longer like that order, lets cancel it.
   */
  // for now we have hardcoded clientId, so we commented this out
  // load the open orders for our OpenOrders account
  // const openOrders = await OpenOrders.load(
  //   connection,
  //   openOrdersKey,
  //   serumProgramId,
  // );
  // // for simplicity we'll just use the clientId
  // const clientId = openOrders.clientIds[0];
  const cancelOrderTx = new Transaction().add(
    await serumInstructions.cancelOrderByClientId(
      program,
      optionPublicKey,
      serumProgramId,
      serumMarketKey,
      { clientId, openOrdersAddress: openOrdersKey } as Order,
    ),
  );
  await program.provider.send(cancelOrderTx);

  /**
   * Exercise 1 option!!
   */
  const exerciseTx = new Transaction();
  const exerciseSigners: Signer[] = [];
  // For the purpose of this example, We'll assume that this associated
  // token account has enough funds to exercise.
  const quoteAssetSource = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    quoteAssetMint,
    wallet.publicKey,
  );
  // renaming for the context of this instruction as this is our Option token address
  // that we will be exercising from.
  const optionTokenSource = optionTokenDest;

  // Since we're exercising a Wrapped Solana option, we must create a Wrapped
  // Sol account for the duration of this transaction. However, as we're receiving
  // Wrapped Sol for exercising the WSol call, we don't need to prefund it with
  // extra lamports.
  const exerciseFees = feeAmountPerContract(option.underlyingAmountPerContract);
  const exerciseNumContracts = 1;
  const exerciseLamports = option.underlyingAmountPerContract
    .add(exerciseFees)
    .mul(new BN(exerciseNumContracts));
  const [createExerciseWSolAccountTx, wSolExerciseKeypair] =
    createWSolAccountInstruction(
      provider,
      splTokenRentBalance + exerciseLamports.toNumber(),
    );
  exerciseTx.add(createExerciseWSolAccountTx);
  exerciseSigners.push(wSolExerciseKeypair);

  // Create the instruction to exercise
  const exerciseIx = await instructions.exerciseOptionsInstruction(
    program,
    new BN(1),
    optionWithKey,
    optionTokenSource,
    wSolExerciseKeypair.publicKey,
    quoteAssetSource,
  );
  exerciseTx.add(exerciseIx);

  // TODO: Close out the wrapped SOL Token account so we get the root SOL
  //  address has all the SOL

  // Sign and send transaction to exercise
  await program.provider.send(exerciseTx, exerciseSigners);
})();
