import { mintCoveredCallInstruction } from '@mithraic-labs/psyoptions';
import { PublicKey, Transaction } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import {
  Asset,
  CreateMissingMintAccountsRes,
  InstructionErrorResponse,
  InstructionResponse,
  NotificationSeverity,
  OptionMarket,
  Result,
  TokenAccount,
} from '../../types';
import { truncatePublicKey } from '../format';
import { WRAPPED_SOL_ADDRESS } from '../token';
import {
  createAssociatedTokenAccountInstruction,
  createNewTokenAccount,
} from './token';

/**
 * Check that all the necessary accounts exist. If they're not provided then
 * instructions will be added to a transaction for creating them.
 *
 */
export const createMissingMintAccounts = async ({
  owner,
  market,
  uAsset,
  uAssetTokenAccount,
  splTokenAccountRentBalance,
  mintedOptionDestinationKey,
  writerTokenDestinationKey,
  numberOfContractsToMint = 1,
}: {
  owner: PublicKey;
  market: OptionMarket;
  uAsset: Asset;
  uAssetTokenAccount: TokenAccount;
  splTokenAccountRentBalance: number;
  mintedOptionDestinationKey?: PublicKey;
  writerTokenDestinationKey?: PublicKey;
  numberOfContractsToMint: number;
  // TODO create an optional return type
}): Promise<Result<CreateMissingMintAccountsRes, InstructionErrorResponse>> => {
  const tx = new Transaction();
  const signers = [];
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
  if (uAsset.mintAddress === WRAPPED_SOL_ADDRESS) {
    const lamports = market.amountPerContract
      .times(uAssetDecimals)
      .times(new BigNumber(numberOfContractsToMint));

    const { transaction, newTokenAccount } = createNewTokenAccount({
      fromPubkey: owner,
      owner,
      mintPublicKey: new PublicKey(WRAPPED_SOL_ADDRESS),
      splTokenAccountRentBalance,
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

  // TODO use amount per contract as validation so we can leave most everything as a BigNumber.
  //  This will be easier to comprehend as it most similarly mirrors chain state.
  const requiredUnderlyingAmount = new BigNumber(market.size).times(
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
    const [instruction, newTokenAccountKey] =
      await createAssociatedTokenAccountInstruction({
        payer: owner,
        owner,
        mintPublicKey: market.optionMintKey,
      });

    tx.add(instruction);
    _mintedOptionDestinationKey = newTokenAccountKey;
  }

  if (!_writerTokenDestinationKey) {
    // Create token account for minted Writer Token if the user doesn't have one yet
    const [instruction, newTokenAccountKey] =
      await createAssociatedTokenAccountInstruction({
        payer: owner,
        owner,
        mintPublicKey: market.writerTokenMintKey,
      });
    tx.add(instruction);
    _writerTokenDestinationKey = newTokenAccountKey;
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
 */
export const mintInstructions = async ({
  numberOfContractsToMint = 1,
  authorityPubkey,
  programId,
  market,
  mintedOptionDestKey,
  writerTokenDestKey,
  underlyingAssetSrcKey,
}: {
  numberOfContractsToMint: number;
  market: OptionMarket;
  authorityPubkey: PublicKey;
  programId: PublicKey;
  mintedOptionDestKey: PublicKey;
  writerTokenDestKey: PublicKey;
  underlyingAssetSrcKey: PublicKey;
}): Promise<InstructionResponse> => {
  const transaction = new Transaction();
  const mintInstruction = await mintCoveredCallInstruction({
    authorityPubkey,
    programId,
    optionMarketKey: market.optionMarketKey,
    optionMintKey: market.optionMintKey,
    mintedOptionDestKey,
    writerTokenDestKey,
    writerTokenMintKey: market.writerTokenMintKey,
    underlyingAssetPoolKey: market.underlyingAssetPoolKey,
    underlyingAssetSrcKey,
    underlyingMintKey: market.underlyingAssetMintKey,
    fundingAccountKey: authorityPubkey,
    size: new BN(numberOfContractsToMint),
  });

  transaction.add(mintInstruction);
  // Not sure if we should add the authoirtyPubkey to signers or if it's safe to
  //  make the assumption that the authority is the wallet.
  const signers = [];

  return { transaction, signers };
};

export const createMissingAccountsAndMint = async ({
  optionsProgramId,
  authorityPubkey,
  owner,
  market,
  uAsset,
  uAssetTokenAccount,
  splTokenAccountRentBalance,
  mintedOptionDestinationKey,
  writerTokenDestinationKey,
  numberOfContractsToMint,
}: {
  optionsProgramId: PublicKey;
  authorityPubkey: PublicKey;
  owner: PublicKey;
  market: OptionMarket;
  uAsset: Asset;
  uAssetTokenAccount: TokenAccount;
  splTokenAccountRentBalance: number;
  mintedOptionDestinationKey?: PublicKey;
  writerTokenDestinationKey?: PublicKey;
  numberOfContractsToMint: number;
}): Promise<Result<CreateMissingMintAccountsRes, InstructionErrorResponse>> => {
  const transaction = new Transaction();
  let signers = [];

  // TODO fix typescript yelling with Either or Option return type from create missing accounts
  const { response, error } = await createMissingMintAccounts({
    owner,
    market,
    uAsset,
    uAssetTokenAccount,
    splTokenAccountRentBalance,
    mintedOptionDestinationKey,
    writerTokenDestinationKey,
    numberOfContractsToMint,
  });
  if (error) {
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

  const { transaction: mintTx } = await mintInstructions({
    numberOfContractsToMint,
    authorityPubkey,
    programId: optionsProgramId,
    market,
    mintedOptionDestKey: _mintedOptionDestinationKey,
    writerTokenDestKey: _writerTokenDestinationKey,
    underlyingAssetSrcKey: _uAssetTokenAccount.pubKey,
  });

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
