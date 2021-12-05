import { useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { instructions } from '@mithraic-labs/psy-american';
import * as anchor from '@project-serum/anchor';
import { BN } from '@project-serum/anchor';
import { useConnectedWallet } from '@saberhq/use-solana';
import { useRecoilValue } from 'recoil';
import useConnection from './useConnection';
import useNotifications from './useNotifications';
import { NotificationSeverity } from '../types';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';
import { activeNetwork, useFetchAndUpsertOption } from '../recoil';

type InitMarketParams = {
  amountPerContract: BigNumber;
  quoteAmountPerContract: BigNumber;
  uAssetMint: PublicKey;
  qAssetMint: PublicKey;
  expiration: number;
  uAssetDecimals: number;
  qAssetDecimals: number;
};

type MarketInitRet = {
  amountPerContract: BigNumber;
  amountPerContractBN: BN;
  quoteAmountPerContract: BigNumber;
  quoteAmountPerContractBN: BN;
  expiration: number;
  optionMarketKey: PublicKey;
  optionMintKey: PublicKey;
  writerTokenMintKey: PublicKey;
  underlyingAssetPoolKey: PublicKey;
  underlyingAssetMintKey: PublicKey;
  quoteAssetPoolKey: PublicKey;
  quoteAssetMintKey: PublicKey;
  psyOptionsProgramId: string;
  serumProgramId?: string;
};
export const useInitializeMarket = (): ((
  obj: InitMarketParams,
) => Promise<MarketInitRet | null>) => {
  const endpoint = useRecoilValue(activeNetwork);
  const program = useAmericanPsyOptionsProgram();
  const { pushNotification, pushErrorNotification } = useNotifications();
  const { dexProgramId } = useConnection();
  const wallet = useConnectedWallet();
  const fetchAndUpsertOption = useFetchAndUpsertOption();

  return useCallback(
    async ({
      amountPerContract,
      quoteAmountPerContract,
      uAssetMint,
      qAssetMint,
      expiration,
      uAssetDecimals,
      qAssetDecimals,
    }: InitMarketParams) => {
      if (!program || !wallet?.connected) {
        // short circuit when there is no program. This is likely
        // due to there being no wallet connected
        pushErrorNotification('Please connect wallet');
        return null;
      }
      try {
        const programId = new PublicKey(endpoint?.programId ?? '');
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

        // Add the newly created option to state
        fetchAndUpsertOption(optionMarketKey);

        const marketData: MarketInitRet = {
          amountPerContract,
          amountPerContractBN,
          quoteAmountPerContract,
          quoteAmountPerContractBN,
          expiration,
          optionMarketKey,
          optionMintKey,
          writerTokenMintKey: writerMintKey,
          underlyingAssetPoolKey,
          underlyingAssetMintKey: underlyingMintKey,
          quoteAssetPoolKey,
          quoteAssetMintKey: quoteMintKey,
          psyOptionsProgramId: programId.toString(),
          serumProgramId: dexProgramId?.toString(),
        };

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
      wallet?.connected,
      pushErrorNotification,
      endpoint?.programId,
      pushNotification,
      fetchAndUpsertOption,
      dexProgramId,
    ],
  );
};
