import { Account, PublicKey, Transaction } from "@solana/web3.js"
import BigNumber from "bignumber.js"

export type Asset = {
  tokenSymbol: string;
  mintAddress: string;
  decimals: number;
}

export type TokenAccount = {
  amount: BigNumber;
  mint: PublicKey;
  // public key for the specific token account (NOT the wallet)
  pubKey: PublicKey;
}

export type OptionMarket = {
  // Leave these in tact as BigNumbers to use later for creating the reciprocal put/call
  amountPerContract: BigNumber;
  quoteAmountPerContract: BigNumber;
  size: string;
  expiration: number;
  uAssetSymbol: string;
  qAssetSymbol: string;
  uAssetMint: string;
  qAssetMint: string;
  strikePrice: string;
  // optionMintAddress is deprecated and references should be removed
  optionMintAddress: string;
  optionMintKey: PublicKey;
  // optionMarketDataAddress is deprecated and references should be removed
  optionMarketDataAddress: string;
  optionMarketKey: PublicKey;
  writerTokenMintKey: PublicKey,
  underlyingAssetPoolKey: PublicKey,
  quoteAssetPoolKey: PublicKey,
}

export enum NotificationSeverity {
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
}
type NotificationData = {
  severity: NotificationSeverity;
  message: string;
}
export type InstructionErrorResponse = {
  error: NotificationData
}
export type InstructionResponse = {
  transaction: Transaction;
  signers: Account[];
  shouldRefreshTokenAccounts?: boolean;
}

export interface CreateMissingMintAccountsRes extends InstructionResponse {
  mintedOptionDestinationKey: PublicKey,
  writerTokenDestinationKey: PublicKey,
  uAssetTokenAccount: TokenAccount,
}