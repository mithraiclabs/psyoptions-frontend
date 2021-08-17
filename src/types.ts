import { Market } from '@mithraic-labs/serum'
import { Account, PublicKey, Transaction } from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import { SerumMarket } from './utils/serum'

export enum ClusterName {
  devnet = 'Devnet',
  mainnet = 'Mainnet',
  testnet = 'Testnet',
  localhost = 'localhost',
}

export enum OptionType {
  CALL = 'call',
  PUT = 'put',
}

export type Asset = {
  tokenSymbol: string
  mintAddress: string
  decimals: number
  icon?: string
  tokenName?: string
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
  strike: BigNumber
  strikePrice?: string
  size: string
  expiration: number
  uAssetSymbol: string
  qAssetSymbol: string
  uAssetMint: string
  qAssetMint: string
  optionMintKey: PublicKey
  optionMarketKey: PublicKey
  writerTokenMintKey: PublicKey
  underlyingAssetPoolKey: PublicKey
  underlyingAssetMintKey: PublicKey
  quoteAssetPoolKey: PublicKey
  quoteAssetMintKey: PublicKey
  serumMarketKey?: PublicKey
  psyOptionsProgramId: string
  serumProgramId: string
}

export type ChainRow = {
  strike: BigNumber
  size: string
  key: string
  call: OptionRow
  put: OptionRow
}

export type OptionRow = OptionMarket & {
  emptyRow?: boolean
  key: string
  ask: string
  bid: string
  change: string
  volume: string
  openInterest: string
  serumMarketKey?: PublicKey
  initialized: boolean
  fraction: string
  reciprocalFraction: string
}

export type CallOrPut = OptionRow & {
  type: OptionType
  strike: BigNumber
}

export type UnsettledRow = CallOrPut & {
  uAssetDecimals: number
  qAssetDecimals: number
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
  loading?: boolean
  error?: Error | string
  serumMarket?: Market
}
