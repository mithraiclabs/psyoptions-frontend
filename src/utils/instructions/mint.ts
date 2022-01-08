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
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import BN from 'bn.js';
import { Program, Provider } from '@project-serum/anchor';
import {
  CreateMissingMintAccountsRes,
  InstructionErrorResponse,
  InstructionResponse,
  NotificationSeverity,
  Result,
} from '../../types';
import { truncatePublicKey } from '../format';
import { initializeTokenAccountTx, WRAPPED_SOL_ADDRESS } from '../token';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

const TEN_BIGNUM = new BigNumber(10);

/**
 * Check that all the necessary accounts exist. If they're not provided then
 * instructions will be added to a transaction for creating them.
 *
 */
export const createMissingMintAccounts = async ({
  option,
  optionUnderlyingAssetSymbol,
  optionUnderlyingDecimals,
  optionUnderlyingSize,
  owner,
  provider,
  mintedOptionDestinationKey,
  numberOfContractsToMint = 1,
  splTokenAccountRentBalance = null,
  underlyingAssetAmount,
  underlyingAssetSource,
  writerTokenDestinationKey,
}: {
  option: OptionMarketWithKey;
  optionUnderlyingAssetSymbol: string;
  optionUnderlyingDecimals: number;
  optionUnderlyingSize: BigNumber;
  owner: PublicKey;
  underlyingAssetAmount: number;
  underlyingAssetSource: PublicKey | undefined;
  splTokenAccountRentBalance: number | null;
  mintedOptionDestinationKey?: PublicKey;
  writerTokenDestinationKey?: PublicKey;
  numberOfContractsToMint: number;
  provider: Provider;
  // TODO create an optional return type
}): Promise<Result<CreateMissingMintAccountsRes, InstructionErrorResponse>> => {
  const tx = new Transaction();
  const signers: Signer[] = [];
  let _mintedOptionDestinationKey = mintedOptionDestinationKey;
  let _underlyingAssetSource = underlyingAssetSource;
  let _writerTokenDestinationKey = writerTokenDestinationKey;

  if (
    !underlyingAssetSource &&
    option.underlyingAssetMint.toString() !== WRAPPED_SOL_ADDRESS
  ) {
    return {
      error: {
        severity: NotificationSeverity.WARNING,
        message: `You must have one or more ${optionUnderlyingAssetSymbol} accounts in your wallet to mint this contract`,
      },
    };
  }

  // Handle Wrapped SOL
  if (
    option.underlyingAssetMint.toString() === WRAPPED_SOL_ADDRESS &&
    splTokenAccountRentBalance
  ) {
    const fees = feeAmountPerContract(option.underlyingAmountPerContract);
    const lamports = option.underlyingAmountPerContract
      .add(fees)
      .mul(new BN(numberOfContractsToMint));
    const { transaction, newTokenAccount } = await initializeTokenAccountTx({
      connection: provider.connection,
      payerKey: owner,
      mintPublicKey: new PublicKey(WRAPPED_SOL_ADDRESS),
      owner,
      rentBalance: splTokenAccountRentBalance,
      extraLamports: lamports.toNumber(),
    });
    tx.add(transaction);
    signers.push(newTokenAccount);
    _underlyingAssetSource = newTokenAccount.publicKey;
  }

  if (!_underlyingAssetSource) {
    return {
      error: {
        severity: NotificationSeverity.WARNING,
        message: `Unable to find ${optionUnderlyingAssetSymbol} token account.`,
      },
    };
  }

  const requiredUnderlyingAmount = optionUnderlyingSize.times(
    new BigNumber(numberOfContractsToMint),
  );
  if (
    new BigNumber(underlyingAssetAmount)
      .div(TEN_BIGNUM.pow(optionUnderlyingDecimals))
      .isLessThan(requiredUnderlyingAmount)
  ) {
    return {
      error: {
        severity: NotificationSeverity.WARNING,
        message: `You must have at least ${requiredUnderlyingAmount.toString(
          10,
        )} ${optionUnderlyingAssetSymbol} in your ${optionUnderlyingAssetSymbol} account ${truncatePublicKey(
          _underlyingAssetSource.toString(),
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
      underlyingAssetSource: _underlyingAssetSource,
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
    ({ ix: mintInstruction } = await instructions.mintOptionV2Instruction(
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
  authorityPubkey,
  mintedOptionDestinationKey,
  optionsProgramId,
  option,
  optionUnderlyingAssetSymbol,
  optionUnderlyingDecimals,
  optionUnderlyingSize,
  owner,
  splTokenAccountRentBalance,
  underlyingAssetAmount,
  underlyingAssetSource,
  writerTokenDestinationKey,
  numberOfContractsToMint,
  program,
}: {
  optionsProgramId: PublicKey;
  authorityPubkey: PublicKey;
  option: OptionMarketWithKey;
  optionUnderlyingAssetSymbol: string;
  optionUnderlyingDecimals: number;
  optionUnderlyingSize: BigNumber;
  owner: PublicKey;
  splTokenAccountRentBalance: number;
  mintedOptionDestinationKey?: PublicKey;
  underlyingAssetAmount: number;
  underlyingAssetSource: PublicKey | undefined;
  writerTokenDestinationKey?: PublicKey;
  numberOfContractsToMint: number;
  program: Program;
}): Promise<Result<CreateMissingMintAccountsRes, InstructionErrorResponse>> => {
  const transaction = new Transaction();
  let signers: Signer[] = [];

  const { response, error } = await createMissingMintAccounts({
    option,
    optionUnderlyingAssetSymbol,
    optionUnderlyingDecimals,
    optionUnderlyingSize,
    owner,
    splTokenAccountRentBalance,
    mintedOptionDestinationKey,
    underlyingAssetAmount,
    underlyingAssetSource,
    writerTokenDestinationKey,
    numberOfContractsToMint,
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
    underlyingAssetSource: _underlyingAssetSource,
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
    _underlyingAssetSource,
    program,
  );

  transaction.add(mintTx);

  return {
    response: {
      transaction,
      signers,
      mintedOptionDestinationKey: _mintedOptionDestinationKey,
      writerTokenDestinationKey: _writerTokenDestinationKey,
      underlyingAssetSource: _underlyingAssetSource,
    },
  };
};
