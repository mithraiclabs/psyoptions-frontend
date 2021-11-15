import { mintCoveredCallInstruction } from '@mithraic-labs/psyoptions';
import {
  PSY_AMERICAN_PROGRAM_IDS,
  ProgramVersions,
  instructions,
  feeAmountPerContract,
  OptionMarketWithKey,
  getOrAddAssociatedTokenAccountTx,
} from '@mithraic-labs/psy-american';
import {
  Account,
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import BN from 'bn.js';
import { Program, Provider } from '@project-serum/anchor';
import {
  Asset,
  CreateMissingMintAccountsRes,
  InstructionErrorResponse,
  InstructionResponse,
  NotificationSeverity,
  Result,
  TokenAccount,
} from '../../types';
import { truncatePublicKey } from '../format';
import { initializeTokenAccountTx, WRAPPED_SOL_ADDRESS } from '../token';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

/**
 * Check that all the necessary accounts exist. If they're not provided then
 * instructions will be added to a transaction for creating them.
 *
 */
export const createMissingMintAccounts = async ({
  option,
  optionUnderlyingSize,
  owner,
  uAsset,
  uAssetTokenAccount = null,
  splTokenAccountRentBalance = null,
  mintedOptionDestinationKey,
  writerTokenDestinationKey,
  numberOfContractsToMint = 1,
  provider,
}: {
  option: OptionMarketWithKey;
  optionUnderlyingSize: BigNumber;
  owner: PublicKey;
  uAsset: Asset;
  uAssetTokenAccount: TokenAccount | null;
  splTokenAccountRentBalance: number | null;
  mintedOptionDestinationKey?: PublicKey;
  writerTokenDestinationKey?: PublicKey;
  numberOfContractsToMint: number;
  provider: Provider;
  // TODO create an optional return type
}): Promise<Result<CreateMissingMintAccountsRes, InstructionErrorResponse>> => {
  const tx = new Transaction();
  const signers: Account[] = [];
  const uAssetSymbol = uAsset.tokenSymbol;
  let _uAssetTokenAccount = uAssetTokenAccount;
  let _mintedOptionDestinationKey = mintedOptionDestinationKey;
  let _writerTokenDestinationKey = writerTokenDestinationKey;

  if (!_uAssetTokenAccount && uAsset.mintAddress !== WRAPPED_SOL_ADDRESS) {
    // TODO - figure out how to distinguish between "a" vs "an" in this message
    // Not that simple because "USDC" you say "A", but for "ETH" you say an, it depends on the pronunciation
    return {
      error: {
        severity: NotificationSeverity.WARNING,
        message: `You must have one or more ${uAssetSymbol} accounts in your wallet to mint this contract`,
      },
    };
  }

  const uAssetDecimals = new BigNumber(10).pow(uAsset.decimals);

  // Handle Wrapped SOL
  if (
    uAsset.mintAddress === WRAPPED_SOL_ADDRESS &&
    splTokenAccountRentBalance
  ) {
    const fees = feeAmountPerContract(option.underlyingAmountPerContract);
    const lamports = option.underlyingAmountPerContract
      .add(fees)
      .mul(new BN(numberOfContractsToMint));
    const { transaction, newTokenAccount } = await initializeTokenAccountTx({
      connection,
      payerKey: owner,
      mintPublicKey: new PublicKey(WRAPPED_SOL_ADDRESS),
      owner,
      rentBalance: splTokenAccountRentBalance,
      extraLamports: lamports.toNumber(),
    });
    tx.add(transaction);
    signers.push(newTokenAccount);
    _uAssetTokenAccount = {
      pubKey: newTokenAccount.publicKey,
      mint: new PublicKey(WRAPPED_SOL_ADDRESS),
      amount: lamports.toNumber(),
    };
  }

  if (!_uAssetTokenAccount) {
    return {
      error: {
        severity: NotificationSeverity.WARNING,
        message: 'Unable to find underlying asset token account.',
      },
    };
  }

  const requiredUnderlyingAmount = optionUnderlyingSize.times(
    new BigNumber(numberOfContractsToMint),
  );
  if (
    new BigNumber(_uAssetTokenAccount.amount)
      .div(uAssetDecimals)
      .isLessThan(requiredUnderlyingAmount)
  ) {
    return {
      error: {
        severity: NotificationSeverity.WARNING,
        message: `You must have at least ${requiredUnderlyingAmount.toString(
          10,
        )} ${uAssetSymbol} in your ${uAssetSymbol} account ${truncatePublicKey(
          _uAssetTokenAccount.pubKey.toString(),
        )} to mint ${numberOfContractsToMint} contract${
          numberOfContractsToMint > 1 ? 's' : ''
        }`,
      },
    };
  }

  if (!_mintedOptionDestinationKey) {
    // Create token account for minted option if the user doesn't have one yet
    const optionTokenDestKey = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      option.optionMint,
      owner,
    );
    const instruction = await getOrAddAssociatedTokenAccountTx(
      optionTokenDestKey,
      option.optionMint,
      provider,
      owner,
    );
    _mintedOptionDestinationKey = optionTokenDestKey;
    if (instruction) {
      tx.add(instruction);
    }
    _mintedOptionDestinationKey = optionTokenDestKey;
    if (instruction) {
      tx.add(instruction);
    }
  }

  if (!_writerTokenDestinationKey) {
    // Create token account for minted Writer Token if the user doesn't have one yet
    const writerTokenDestKey = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      option.writerTokenMint,
      owner,
    );
    const instruction = await getOrAddAssociatedTokenAccountTx(
      writerTokenDestKey,
      option.writerTokenMint,
      provider,
      owner,
    );
    _writerTokenDestinationKey = writerTokenDestKey;
    if (instruction) {
      tx.add(instruction);
    }
  }

  return {
    response: {
      transaction: tx,
      signers,
      mintedOptionDestinationKey: _mintedOptionDestinationKey,
      writerTokenDestinationKey: _writerTokenDestinationKey,
      uAssetTokenAccount: _uAssetTokenAccount,
    },
  };
};

/**
 * Generate a transaction containing 1 or more mint option instructions.
 *
 * @param numberOfContractsToMint
 * @param market
 * @param authorityPubkey
 * @param programId
 * @param mintedOptionDestKey
 * @param writerTokenDestKey
 * @param underlyingAssetSrcKey
 * @param program
 * @returns
 */
export const mintInstructions = async (
  numberOfContractsToMint: number,
  option: OptionMarketWithKey,
  authorityPubkey: PublicKey,
  programId: PublicKey,
  mintedOptionDestKey: PublicKey,
  writerTokenDestKey: PublicKey,
  underlyingAssetSrcKey: PublicKey,
  program?: Program,
): Promise<InstructionResponse> => {
  const transaction = new Transaction();
  let mintInstruction: TransactionInstruction | null = null;

  // Handle backwards compatibility for the old PsyOptions version
  if (
    PSY_AMERICAN_PROGRAM_IDS[
      programId.toString() as keyof typeof PSY_AMERICAN_PROGRAM_IDS
    ] === ProgramVersions.V1
  ) {
    mintInstruction = await mintCoveredCallInstruction({
      authorityPubkey,
      programId,
      optionMarketKey: option.key,
      optionMintKey: option.optionMint,
      mintedOptionDestKey,
      writerTokenDestKey,
      writerTokenMintKey: option.writerTokenMint,
      underlyingAssetPoolKey: option.underlyingAssetPool,
      underlyingAssetSrcKey,
      underlyingMintKey: option.underlyingAssetMint,
      fundingAccountKey: authorityPubkey,
      size: new BN(numberOfContractsToMint),
    });
  } else if (program) {
    ({ ix: mintInstruction } = await instructions.mintOptionInstruction(
      program,
      mintedOptionDestKey,
      writerTokenDestKey,
      underlyingAssetSrcKey,
      new BN(numberOfContractsToMint),
      option,
    ));
  }
  if (mintInstruction) {
    transaction.add(mintInstruction);
  }
  // Not sure if we should add the authoirtyPubkey to signers or if it's safe to
  //  make the assumption that the authority is the wallet.
  const signers: Signer[] = [];

  return { transaction, signers };
};

export const createMissingAccountsAndMint = async ({
  optionsProgramId,
  authorityPubkey,
  option,
  optionUnderlyingSize,
  owner,
  uAsset,
  uAssetTokenAccount,
  splTokenAccountRentBalance,
  mintedOptionDestinationKey,
  writerTokenDestinationKey,
  numberOfContractsToMint,
  program,
}: {
  optionsProgramId: PublicKey;
  authorityPubkey: PublicKey;
  option: OptionMarketWithKey;
  optionUnderlyingSize: BigNumber;
  owner: PublicKey;
  uAsset: Asset;
  uAssetTokenAccount: TokenAccount | null;
  splTokenAccountRentBalance: number;
  mintedOptionDestinationKey?: PublicKey;
  writerTokenDestinationKey?: PublicKey;
  numberOfContractsToMint: number;
  program: Program;
}): Promise<Result<CreateMissingMintAccountsRes, InstructionErrorResponse>> => {
  const transaction = new Transaction();
  let signers: Signer[] = [];

  const { response, error } = await createMissingMintAccounts({
    option,
    owner,
    uAsset,
    uAssetTokenAccount,
    splTokenAccountRentBalance,
    mintedOptionDestinationKey,
    writerTokenDestinationKey,
    numberOfContractsToMint,
    optionUnderlyingSize,
    provider: program.provider,
  });
  if (error || !response) {
    return { error };
  }
  const {
    transaction: createAccountsTx,
    signers: createAccountsSigners,
    mintedOptionDestinationKey: _mintedOptionDestinationKey,
    writerTokenDestinationKey: _writerTokenDestinationKey,
    uAssetTokenAccount: _uAssetTokenAccount,
  } = response;

  transaction.add(createAccountsTx);
  signers = [...signers, ...createAccountsSigners];

  const { transaction: mintTx } = await mintInstructions(
    numberOfContractsToMint,
    option,
    authorityPubkey,
    optionsProgramId,
    _mintedOptionDestinationKey,
    _writerTokenDestinationKey,
    _uAssetTokenAccount.pubKey,
    program,
  );

  transaction.add(mintTx);

  return {
    response: {
      transaction,
      signers,
      mintedOptionDestinationKey: _mintedOptionDestinationKey,
      writerTokenDestinationKey: _writerTokenDestinationKey,
      uAssetTokenAccount: _uAssetTokenAccount,
    },
  };
};
