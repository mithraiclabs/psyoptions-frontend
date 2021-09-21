import { BN } from '@project-serum/anchor';
import { OptionMarket as PsyAmericanOptionInfo } from '@mithraic-labs/psy-american';
import { SystemProgram } from '@solana/web3.js';
import { OptionMarket } from '../types';

export const uiOptionMarketToProtocolOptionMarket = (
  uiOptionMarket: OptionMarket,
): PsyAmericanOptionInfo => ({
  key: uiOptionMarket.pubkey,
  optionMint: uiOptionMarket.optionMintKey,
  writerTokenMint: uiOptionMarket.writerTokenMintKey,
  underlyingAssetMint: uiOptionMarket.underlyingAssetMintKey,
  quoteAssetMint: uiOptionMarket.quoteAssetMintKey,
  underlyingAssetPool: uiOptionMarket.underlyingAssetPoolKey,
  quoteAssetPool: uiOptionMarket.quoteAssetPoolKey,
  // Dummy variable, mintFeeAccount shouldn't be needed
  mintFeeAccount: SystemProgram.programId,
  // Dummy variable, exerciseFeeAccount shouldn't be needed
  exerciseFeeAccount: SystemProgram.programId,
  underlyingAmountPerContract: uiOptionMarket.amountPerContractBN,
  quoteAmountPerContract: uiOptionMarket.quoteAmountPerContractBN,
  expirationUnixTimestamp: new BN(uiOptionMarket.expiration),
  expired: uiOptionMarket.expiration < new Date().getTime() / 1000,
  bumpSeed: 0,
});
