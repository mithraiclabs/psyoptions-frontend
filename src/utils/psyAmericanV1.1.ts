import * as anchor from '@project-serum/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

export const initSetup = async (
  provider: anchor.Provider,
  payer: anchor.web3.Keypair,
  program: anchor.Program,
  underlyingToken: Token,
  quoteToken: Token,
  underlyingAmountPerContract: anchor.BN,
  quoteAmountPerContract: anchor.BN,
  opts: {
    mintFeeToken?: Token;
    exerciseFeeToken?: Token;
    mintFeeOwner?: anchor.web3.PublicKey;
    exerciseFeeOwner?: anchor.web3.PublicKey;
    expiration?: anchor.BN;
  } = {},
) => {
  const textEncoder = new TextEncoder();
  let expiration =
    opts.expiration || new anchor.BN(new Date().getTime() / 1000 + 3600);
  let optionMarketKey: anchor.web3.PublicKey;
  let bumpSeed: number;
  let mintFeeKey = new anchor.web3.Keypair().publicKey;
  let exerciseFeeKey = new anchor.web3.Keypair().publicKey;
  let remainingAccounts: anchor.web3.AccountMeta[] = [];
  let instructions: anchor.web3.TransactionInstruction[] = [];

  [optionMarketKey, bumpSeed] = await anchor.web3.PublicKey.findProgramAddress(
    [
      underlyingToken.publicKey.toBuffer(),
      quoteToken.publicKey.toBuffer(),
      underlyingAmountPerContract.toBuffer('le', 8),
      quoteAmountPerContract.toBuffer('le', 8),
      expiration.toBuffer('le', 8),
    ],
    program.programId,
  );

  const [optionMintKey, optionMintBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [optionMarketKey.toBuffer(), textEncoder.encode('optionToken')],
      program.programId,
    );

  const [writerMintKey, writerMintBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [optionMarketKey.toBuffer(), textEncoder.encode('writerToken')],
      program.programId,
    );
  const [quoteAssetPoolKey, quoteAssetPoolBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [optionMarketKey.toBuffer(), textEncoder.encode('quoteAssetPool')],
      program.programId,
    );

  const [underlyingAssetPoolKey, underlyingAssetPoolBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [optionMarketKey.toBuffer(), textEncoder.encode('underlyingAssetPool')],
      program.programId,
    );

  // Get the associated fee address if the market requires a fee
  const mintFee = feeAmount(underlyingAmountPerContract);
  if (mintFee.gtn(0)) {
    mintFeeKey = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      opts.mintFeeToken?.publicKey || underlyingToken.publicKey,
      opts.mintFeeOwner || FEE_OWNER_KEY,
    );
    remainingAccounts.push({
      pubkey: mintFeeKey,
      isWritable: true,
      isSigner: false,
    });
    const ix = await getOrAddAssociatedTokenAccountTx(
      mintFeeKey,
      opts.mintFeeToken || underlyingToken,
      payer.publicKey,
      opts.mintFeeOwner || FEE_OWNER_KEY,
    );
    if (ix) {
      instructions.push(ix);
    }
  }

  const exerciseFee = feeAmount(quoteAmountPerContract);
  if (exerciseFee.gtn(0)) {
    exerciseFeeKey = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      opts.exerciseFeeToken?.publicKey || quoteToken.publicKey,
      opts.exerciseFeeOwner || FEE_OWNER_KEY,
    );
    remainingAccounts.push({
      pubkey: exerciseFeeKey,
      isWritable: false,
      isSigner: false,
    });
    const ix = await getOrAddAssociatedTokenAccountTx(
      exerciseFeeKey,
      opts.exerciseFeeToken || quoteToken,
      payer.publicKey,
      opts.exerciseFeeOwner || FEE_OWNER_KEY,
    );
    if (ix) {
      instructions.push(ix);
    }
  }
  const optionMarket: OptionMarketV2 = {
    key: optionMarketKey,
    optionMint: optionMintKey,
    writerTokenMint: writerMintKey,
    underlyingAssetMint: underlyingToken.publicKey,
    quoteAssetMint: quoteToken.publicKey,
    underlyingAssetPool: underlyingAssetPoolKey,
    quoteAssetPool: quoteAssetPoolKey,
    mintFeeAccount: mintFeeKey,
    exerciseFeeAccount: exerciseFeeKey,
    underlyingAmountPerContract,
    quoteAmountPerContract,
    expirationUnixTimestamp: expiration,
    expired: false,
    bumpSeed,
  };

  const optionToken = new Token(
    provider.connection,
    optionMintKey,
    TOKEN_PROGRAM_ID,
    payer,
  );

  return {
    quoteToken,
    underlyingToken,
    optionToken,
    underlyingAmountPerContract,
    quoteAmountPerContract,
    expiration,
    optionMarketKey,
    bumpSeed,
    mintFeeKey,
    exerciseFeeKey,
    optionMintKey,
    writerMintKey,
    underlyingAssetPoolKey,
    quoteAssetPoolKey,
    optionMarket,
    remainingAccounts,
    instructions,
  };
};
