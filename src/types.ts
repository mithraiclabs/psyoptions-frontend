import { Token } from '@mithraic-labs/market-meta/dist/types';
import { Market } from '@mithraic-labs/serum';
import { BN } from '@project-serum/anchor';
import { PublicKey, Signer, Transaction } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

export enum ClusterName {
  devnet = 'Devnet',
  mainnet = 'Mainnet',
  testnet = 'Testnet',
  localhost = 'localhost',
  custom = 'Custom',
}

export enum OptionType {
  CALL = 'call',
  PUT = 'put',
}

export type Asset = {
  tokenSymbol: string;
  mintAddress: string;
  decimals: number;
  icon?: string;
  tokenName?: string;
};

export type TokenAccount = {
  amount: number;
  mint: PublicKey;
  // public key for the specific token account (NOT the wallet)
  pubKey: PublicKey;
};

export type OptionMarket = {
  key: string;
  // Leave these in tact as BigNumbers to use later for creating the reciprocal put/call
  pubkey: PublicKey;
  amountPerContract: BigNumber;
  quoteAmountPerContract: BigNumber;
  amountPerContractBN: BN;
  quoteAmountPerContractBN: BN;
  strike: BigNumber;
  strikePrice?: string;
  size: string;
  expiration: number;
  uAssetSymbol: string;
  qAssetSymbol: string;
  uAssetMint: string;
  qAssetMint: string;
  optionMintKey: PublicKey;
  optionMarketKey: PublicKey;
  writerTokenMintKey: PublicKey;
  underlyingAssetPoolKey: PublicKey;
  underlyingAssetMintKey: PublicKey;
  quoteAssetPoolKey: PublicKey;
  quoteAssetMintKey: PublicKey;
  serumMarketKey?: PublicKey;
  psyOptionsProgramId: string;
  serumProgramId: string;
};

export type ChainRow = {
  strike: BigNumber;
  key: string;
  call: OptionRow;
  put: OptionRow;
};

export type OptionRow = OptionMarket & {
  emptyRow?: boolean;
  key: PublicKey;
  change: string;
  volume: string;
  openInterest: string;
  serumMarketKey?: PublicKey;
  initialized: boolean;
  fraction: string;
  reciprocalFraction: string;
};

export type CallOrPut = OptionRow & {
  type: OptionType;
  strike: BigNumber;
};

export type OptionMarketMeta = {
  expiration: number;
  optionMarketAddress: string;
  optionContractMintAddress: string;
  optionWriterTokenMintAddress: string;
  quoteAssetMint: string;
  quoteAssetSymbol: string;
  underlyingAssetMint: string;
  underlyingAssetSymbol: string;
  underlyingAssetPerContract: string;
  quoteAssetPerContract: string;
  serumMarketAddress: string;
};

export enum NotificationSeverity {
  ERROR = 'error',
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
}
type NotificationData = {
  severity: NotificationSeverity;
  message: string;
};

export interface InstructionErrorResponse extends NotificationData {
  err?: Error;
}
export type Result<T, E> = {
  response?: T;
  error?: E;
};
export type InstructionResponse = {
  transaction: Transaction;
  signers: Signer[];
};
export interface CreateNewTokenAccountResponse extends InstructionResponse {
  newTokenAccount: Signer;
}
export interface CreateMissingMintAccountsRes extends InstructionResponse {
  mintedOptionDestinationKey: PublicKey;
  writerTokenDestinationKey: PublicKey;
  underlyingAssetSource: PublicKey;
}

export type LocalSerumMarket = {
  loading?: boolean;
  error?: Error | string;
  serumMarket?: Market;
  serumProgramId?: string;
};

export type SerumMarketAndProgramId = {
  serumMarketKey: PublicKey;
  serumProgramId: string;
};

export type Balance = {
  asset: Token;
  assetBalance: number;
};
