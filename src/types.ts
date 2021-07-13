import { Account, PublicKey, Transaction } from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import { SerumMarket } from './utils/serum'

export enum ClusterName {
  devnet = 'Devnet',
  mainnet = 'Mainnet',
  testnet = 'Testnet',
  localhost = 'localhost',
}

export type Asset = {
  tokenSymbol: string
  mintAddress: string
  decimals: number
}

export type TokenAccount = {
  amount: number
  mint: PublicKey
  // public key for the specific token account (NOT the wallet)
  pubKey: PublicKey
}

export type OptionMarket = {
  key: string
  // Leave these in tact as BigNumbers to use later for creating the reciprocal put/call
  amountPerContract: BigNumber
  quoteAmountPerContract: BigNumber
  size: string
  expiration: number
  uAssetSymbol: string
  qAssetSymbol: string
  uAssetMint: string
  qAssetMint: string
  strikePrice: string
  optionMintKey: PublicKey
  optionMarketKey: PublicKey
  writerTokenMintKey: PublicKey
  underlyingAssetPoolKey: PublicKey
  underlyingAssetMintKey: PublicKey
  quoteAssetPoolKey: PublicKey
  quoteAssetMintKey: PublicKey
  serumMarketKey?: PublicKey
}

export type OptionMarketMeta = {
  expiration: number
  optionMarketAddress: string
  optionContractMintAddress: string
  optionWriterTokenMintAddress: string
  quoteAssetMint: string
  quoteAssetSymbol: string
  underlyingAssetMint: string
  underlyingAssetSymbol: string
  underlyingAssetPerContract: string
  quoteAssetPerContract: string
  serumMarketAddress: string
}

export enum NotificationSeverity {
  ERROR = 'error',
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
}
type NotificationData = {
  severity: NotificationSeverity
  message: string
}

export interface InstructionErrorResponse extends NotificationData {
  err?: Error
}
export type Result<T, E> = {
  response?: T
  error?: E
}
export type InstructionResponse = {
  transaction: Transaction
  signers: Account[]
}
export interface CreateNewTokenAccountResponse extends InstructionResponse {
  newTokenAccount: Account
}
export interface CreateMissingMintAccountsRes extends InstructionResponse {
  mintedOptionDestinationKey: PublicKey
  writerTokenDestinationKey: PublicKey
  uAssetTokenAccount: TokenAccount
}

export type LocalSerumMarket = {
  loading: boolean
  error: Error | string | undefined
  serumMarket: SerumMarket
}
