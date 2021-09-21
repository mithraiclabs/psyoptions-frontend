import { useCallback, useContext } from 'react';
import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { instructions } from '@mithraic-labs/psy-american';
import * as anchor from '@project-serum/anchor';
import { BN } from '@project-serum/anchor';
import useConnection from './useConnection';
import useNotifications from './useNotifications';
import { OptionsMarketsContext } from '../context/OptionsMarketsContext';
import { NotificationSeverity, OptionMarket } from '../types';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';
import WalletAdapter from '../utils/wallet/walletAdapter';

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
      if (!program || !(program.provider.wallet as WalletAdapter).connected) {
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

        const amountPerContractBN = new BN(
          amountPerContract
            .multipliedBy(new BigNumber(10).pow(uAssetDecimals))
            .toString(10),
        );
        const quoteAmountPerContractBN = new BN(
          quoteAmountPerContract
            .multipliedBy(new BigNumber(10).pow(qAssetDecimals))
            .toString(10),
        );

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
          quoteAmountPerContract: quoteAmountPerContractBN,
          quoteMint: quoteMintKey,
          underlyingAmountPerContract: amountPerContractBN,
          underlyingMint: underlyingMintKey,
        });

        const strike = quoteAmountPerContract.div(amountPerContract);

        const marketData: OptionMarket = {
          key: `${expiration}-${uAssetSymbol}-${qAssetSymbol}-${amountPerContract.toString()}-${amountPerContract.toString()}/${quoteAmountPerContract.toString()}`,
          pubkey: optionMarketKey,
          amountPerContract,
          amountPerContractBN,
          quoteAmountPerContract,
          quoteAmountPerContractBN,
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
