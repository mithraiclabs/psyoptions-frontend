import { useCallback, useContext } from 'react';
import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { instructions } from '@mithraic-labs/psy-american';
import * as anchor from '@project-serum/anchor';
import useConnection from './useConnection';
import useNotifications from './useNotifications';
import { OptionsMarketsContext } from '../context/OptionsMarketsContext';
import { NotificationSeverity, OptionMarket } from '../types';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';

type InitMarketParams = {
  amountPerContract: BigNumber;
  quoteAmountPerContract: BigNumber;
  uAssetSymbol: string;
  qAssetSymbol: string;
  uAssetMint: string;
  qAssetMint: string;
  expiration: number;
  uAssetDecimals: number;
  qAssetDecimals: number;
};
export const useInitializeMarket = (): ((
  obj: InitMarketParams,
) => Promise<OptionMarket | null>) => {
  const program = useAmericanPsyOptionsProgram();
  const { pushNotification, pushErrorNotification } = useNotifications();
  const { endpoint, dexProgramId } = useConnection();
  const { setMarkets } = useContext(OptionsMarketsContext);

  return useCallback(
    async ({
      amountPerContract,
      quoteAmountPerContract,
      uAssetSymbol,
      qAssetSymbol,
      uAssetMint,
      qAssetMint,
      expiration,
      uAssetDecimals,
      qAssetDecimals,
    }: InitMarketParams) => {
      if (!program) {
        // short circuit when there is no program. This is likely
        // due to there being no wallet connected
        pushErrorNotification('Please connect wallet');
        return null;
      }
      try {
        const programId = new PublicKey(endpoint.programId);
        const quoteMintKey = new PublicKey(qAssetMint);
        const underlyingMintKey = new PublicKey(uAssetMint);
        // Create and send transaction for creating/initializing accounts needed
        // for option market

        const amountPerContractU64 = amountPerContract
          .multipliedBy(new BigNumber(10).pow(uAssetDecimals))
          .toNumber();
        const quoteAmountPerContractU64 = quoteAmountPerContract
          .multipliedBy(new BigNumber(10).pow(qAssetDecimals))
          .toNumber();

        pushNotification({
          severity: NotificationSeverity.INFO,
          message: 'Processing: Initialize Market',
        });

        const {
          optionMarketKey,
          optionMintKey,
          quoteAssetPoolKey,
          underlyingAssetPoolKey,
          writerMintKey,
        } = await instructions.initializeMarket(program, {
          expirationUnixTimestamp: new anchor.BN(expiration),
          quoteAmountPerContract: new anchor.BN(quoteAmountPerContractU64),
          quoteMint: quoteMintKey,
          underlyingAmountPerContract: new anchor.BN(amountPerContractU64),
          underlyingMint: underlyingMintKey,
        });

        const strike = quoteAmountPerContract.div(amountPerContract);

        const marketData: OptionMarket = {
          key: `${expiration}-${uAssetSymbol}-${qAssetSymbol}-${amountPerContract.toString()}-${amountPerContract.toString()}/${quoteAmountPerContract.toString()}`,
          pubkey: optionMarketKey,
          amountPerContract,
          quoteAmountPerContract,
          size: `${amountPerContract.toNumber()}`,
          strike,
          strikePrice: strike.toString(),
          uAssetSymbol,
          qAssetSymbol,
          uAssetMint,
          qAssetMint,
          expiration,
          optionMarketKey,
          optionMintKey,
          writerTokenMintKey: writerMintKey,
          underlyingAssetPoolKey,
          underlyingAssetMintKey: underlyingMintKey,
          quoteAssetPoolKey,
          quoteAssetMintKey: quoteMintKey,
          psyOptionsProgramId: programId.toString(),
          serumProgramId: dexProgramId.toString(),
        };

        setMarkets((markets) => ({ ...markets, [marketData.key]: marketData }));

        pushNotification({
          severity: NotificationSeverity.SUCCESS,
          message: 'Confirmed: Initialize Market',
        });

        return marketData;
      } catch (err) {
        console.log(err);
        pushErrorNotification(err);
      }
      return null;
    },
    [
      program,
      pushErrorNotification,
      endpoint.programId,
      pushNotification,
      dexProgramId,
      setMarkets,
    ],
  );
};
