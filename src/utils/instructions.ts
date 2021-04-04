/**
 * This file is for pure functions only. They are to extract some of the 
 * complexities out of the application code, while still allowing the application to 
 * fetch and update data in their own manner.
 */

import { AccountLayout, Token } from "@solana/spl-token";
import { Account, PublicKey, SystemProgram, Transaction } from "@solana/web3.js"
import BigNumber from "bignumber.js";
import { Asset, OptionMarket, TokenAccount } from "../types";
import { truncatePublicKey } from "./format";
import { WRAPPED_SOL_ADDRESS } from "./token";
import { TOKEN_PROGRAM_ID } from './tokenInstructions'

/**
 * Create and initialize a new SPL Token account for the provided owner. Initial
 * lamports are give from the _fromPubkey_ account.
 */
const createNewTokenAccount = ({
  fromPubkey,
  owner,
  mintPublicKey,
  splTokenAccountRentBalance,
  extraLamports=0,
} : {
  fromPubkey: PublicKey;
  owner: PublicKey;
  mintPublicKey: PublicKey;
  splTokenAccountRentBalance: number;
  extraLamports?: number;
}) => {
  const newAccount = new Account()
  const transaction = new Transaction()

  transaction.add(
    SystemProgram.createAccount({
      fromPubkey,
      newAccountPubkey: newAccount.publicKey,
      lamports: splTokenAccountRentBalance + extraLamports,
      space: AccountLayout.span,
      programId: TOKEN_PROGRAM_ID,
    })
  )

  transaction.add(
    Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      mintPublicKey,
      newAccount.publicKey,
      owner
    )
  )

  const signers = [newAccount]

  return {transaction, signers, newTokenAccount: newAccount}
}

/**
 * Check that all the necessary accounts exist. If they're not provided then
 * instructions will be added to a transaction for creating them.
 */
export const createMissingMintAccounts = ({
  owner,
  market,
  uAsset,
  uAssetTokenAccount,
  splTokenAccountRentBalance,
  mintedOptionDestinationKey,
  writerTokenDestinationKey,
} : {
  owner: PublicKey;
  market: OptionMarket;
  uAsset: Asset;
  qAsset: Asset;
  uAssetTokenAccount: TokenAccount;
  splTokenAccountRentBalance: number;
  mintedOptionDestinationKey?: PublicKey;
  writerTokenDestinationKey?: PublicKey;
}) => {
  const tx = new Transaction();
  const signers = []
  const uAssetSymbol = uAsset.tokenSymbol
  let _uAssetTokenAccount = uAssetTokenAccount
  let _mintedOptionDestinationKey = mintedOptionDestinationKey;
  let _writerTokenDestinationKey = writerTokenDestinationKey;
  let shouldRefreshTokenAccounts = false

  if (!_uAssetTokenAccount && uAsset.mintAddress !== WRAPPED_SOL_ADDRESS) {
    // TODO - figure out how to distinguish between "a" vs "an" in this message
    // Not that simple because "USDC" you say "A", but for "ETH" you say an, it depends on the pronunciation
    return {error: {
      severity: 'warning',
      message: `You must have one or more ${uAssetSymbol} accounts in your wallet to mint this contract`,
    }}
  }

  const uAssetDecimals = new BigNumber(10).pow(uAsset.decimals)

  // Handle Wrapped SOL
  if (uAsset.mintAddress === WRAPPED_SOL_ADDRESS) {
    const lamports = market.amountPerContract.times(uAssetDecimals)


    const { transaction, newTokenAccount } = createNewTokenAccount({
      fromPubkey: owner,
      owner,
      mintPublicKey: new PublicKey(WRAPPED_SOL_ADDRESS),
      splTokenAccountRentBalance,
      extraLamports: lamports.toNumber(),
    })
    tx.add(transaction)
    signers.push(newTokenAccount)

    _uAssetTokenAccount = { 
      pubKey: newTokenAccount.publicKey,
      mint: new PublicKey(WRAPPED_SOL_ADDRESS),
      amount: lamports,
    }
  }

  // TODO use amount per contract as validation so we can leave most everything as a BigNumber.
  //  This will be easier to comprehend as it most similarly mirrors chain state. 
  if (_uAssetTokenAccount.amount.div(uAssetDecimals).isLessThan(new BigNumber(market.size))) {
    return {
      severity: 'warning',
      message: `You must have at least ${market.size} ${uAssetSymbol} in your ${uAssetSymbol} account ${truncatePublicKey(
        _uAssetTokenAccount.pubKey,
      )} to mint this contract`,
    }
  }

  if (!_mintedOptionDestinationKey) {
    // Create token account for minted option if the user doesn't have one yet
    const { transaction, newTokenAccount } = createNewTokenAccount({
      fromPubkey: owner,
      owner,
      mintPublicKey: market.optionMintKey,
      splTokenAccountRentBalance
    })
    
    tx.add(transaction)
    signers.push(newTokenAccount)
    _mintedOptionDestinationKey = newTokenAccount.publicKey
    shouldRefreshTokenAccounts = true
  }

  if (!_writerTokenDestinationKey) {
    // Create token account for minted Writer Token if the user doesn't have one yet
    const { transaction, newTokenAccount } = createNewTokenAccount({
      fromPubkey: owner,
      owner,
      mintPublicKey: market.writerTokenMintKey,
      splTokenAccountRentBalance
    })
    tx.add(transaction)
    signers.push(newTokenAccount)
    _writerTokenDestinationKey = newTokenAccount.publicKey
    shouldRefreshTokenAccounts = true
  }

  return { 
    transaction: tx,
    signers,
    shouldRefreshTokenAccounts,
    mintedOptionDestinationKey: _mintedOptionDestinationKey,
    writerTokenDestinationKey: _writerTokenDestinationKey,
    uAssetKey: _uAssetTokenAccount.pubKey,
  }
}