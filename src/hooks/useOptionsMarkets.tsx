import { useContext, useCallback } from 'react';
import BigNumber from 'bignumber.js';
import {
  getAllOptionAccounts,
  OptionMarketWithKey as AmericanOptionData,
} from '@mithraic-labs/psy-american';
import { Connection, PublicKey } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useRecoilValue } from 'recoil';
import { BN } from '@project-serum/anchor';

import useNotifications from './useNotifications';
import { useConnectedWallet } from '@saberhq/use-solana';
import useConnection from './useConnection';
import useAssetList from './useAssetList';
import useSendTransaction from './useSendTransaction';

import { OptionsMarketsContext } from '../context/OptionsMarketsContext';

import { WRAPPED_SOL_ADDRESS } from '../utils/token';
import { mintInstructions } from '../utils/instructions/index';

import { ClusterName, OptionMarket } from '../types';
import { getSupportedMarketsByNetwork } from '../utils/networkInfo';
import { findMarketByAssets } from '../utils/serum';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';
import { activeNetwork } from '../recoil';

const useOptionsMarkets = () => {
  const endpoint = useRecoilValue(activeNetwork);
  const program = useAmericanPsyOptionsProgram();
  const { pushErrorNotification } = useNotifications();
  const wallet = useConnectedWallet();
  const { connection, dexProgramId } = useConnection();
  const { sendTransaction } = useSendTransaction();
  const {
    marketsByUiKey,
    setMarkets,
    marketsLoading,
    setMarketsLoading,
    marketsBySerumKey,
    setMarketsBySerumKey,
  } = useContext(OptionsMarketsContext);
  const { supportedAssets } = useAssetList();

  /**
   * fetches PsyOptions market data individually. Should only be used for local development as
   * it makes chain requests inefficiently.
   */
  const fetchMarketData = useCallback(async () => {
    try {
      if (
        marketsLoading ||
        !endpoint ||
        !endpoint.programId ||
        !program ||
        !dexProgramId
      )
        return;
      if (!(connection instanceof Connection)) return;
      if (!supportedAssets || supportedAssets.length === 0) return;

      setMarketsLoading(true);

      const res = await getAllOptionAccounts(program);

      // Transform the market data to our expectations
      const newMarketsByUiKey = {} as Record<string, OptionMarket>;
      const newMarketsBySerumKey = {} as Record<string, OptionMarket>;
      await Promise.all(
        res.map(async (optionMarket: AmericanOptionData) => {
          const uAssetMint = optionMarket.underlyingAssetMint;
          const uAsset = supportedAssets.filter(
            (asset) => asset.mintAddress === uAssetMint.toString(),
          )[0];
          const qAssetMint = optionMarket.quoteAssetMint;
          const qAsset = supportedAssets.filter(
            (asset) => asset.mintAddress === qAssetMint.toString(),
          )[0];

          // BN.js doesn't handle decimals while bignumber.js can handle decimals of arbitrary sizes
          // So convert all BN types to BigNumber
          const amountPerContract = new BigNumber(
            optionMarket.underlyingAmountPerContract.toString(10),
          ).div(10 ** uAsset?.decimals);

          const quoteAmountPerContract = new BigNumber(
            optionMarket.quoteAmountPerContract.toString(10),
          ).div(10 ** qAsset?.decimals);

          const strike = quoteAmountPerContract.div(
            amountPerContract.toString(10),
          );

          const {
            expirationUnixTimestamp,
            optionMint,
            writerTokenMint,
            underlyingAssetPool,
            underlyingAssetMint,
            quoteAssetPool,
            quoteAssetMint,
          } = optionMarket;

          const serumMarket = await findMarketByAssets(
            connection,
            optionMint,
            quoteAssetMint,
            dexProgramId,
          );
          // Short circuit if there is no serumMarket because OptionMarket must have a serumMarketKey
          if (!serumMarket || !uAsset || !qAsset) {
            console.warn(
              `market with address: ${optionMarket.key.toString()} is missing required data`,
            );
            return;
          }

          const newMarket: OptionMarket = {
            key: `${expirationUnixTimestamp}-${uAsset?.tokenSymbol}-${
              qAsset?.tokenSymbol
            }-${amountPerContract.toString()}-${amountPerContract.toString()}/${quoteAmountPerContract.toString()}`,
            pubkey: optionMarket.key,
            amountPerContract,
            amountPerContractBN: optionMarket.underlyingAmountPerContract,
            quoteAmountPerContract,
            quoteAmountPerContractBN: optionMarket.quoteAmountPerContract,
            size: `${amountPerContract.toString(10)}`,
            uAssetSymbol: uAsset.tokenSymbol,
            qAssetSymbol: qAsset.tokenSymbol,
            uAssetMint: uAsset.mintAddress,
            qAssetMint: qAsset.mintAddress,
            strike,
            optionMarketKey: optionMarket.key,
            expiration: expirationUnixTimestamp.toNumber(),
            optionMintKey: optionMint,
            writerTokenMintKey: writerTokenMint,
            underlyingAssetPoolKey: underlyingAssetPool,
            underlyingAssetMintKey: underlyingAssetMint,
            quoteAssetPoolKey: quoteAssetPool,
            quoteAssetMintKey: quoteAssetMint,
            serumMarketKey: serumMarket.address,
            psyOptionsProgramId: endpoint.programId!,
            serumProgramId: dexProgramId.toString(),
          };

          const key = `${newMarket.expiration}-${newMarket.uAssetSymbol}-${
            newMarket.qAssetSymbol
          }-${newMarket.size}-${amountPerContract.toString(
            10,
          )}/${quoteAmountPerContract.toString(10)}`;

          newMarketsByUiKey[key] = newMarket;
          newMarketsBySerumKey[serumMarket.address.toString()] = newMarket;
        }),
      );

      // Not sure if we should replace the existing markets or merge them
      setMarkets(newMarketsByUiKey);
      setMarketsBySerumKey(newMarketsBySerumKey);
      setMarketsLoading(false);
      return;
    } catch (err) {
      console.error(err);
      setMarketsLoading(false);
    }
  }, [connection, supportedAssets, endpoint, program, dexProgramId]); // eslint-disable-line

  const packagedMarkets = useCallback(async () => {
    if (!endpoint) return;
    if (endpoint.name === ClusterName.localhost) {
      return fetchMarketData();
    }
    try {
      setMarketsLoading(true);
      const supportedMarkets = getSupportedMarketsByNetwork(endpoint.name);

      // Transform the market data to our expectations
      const newMarketsByUiKey = {} as Record<string, OptionMarket>;
      const newMarketsBySerumKey = {} as Record<string, OptionMarket>;

      supportedMarkets.forEach((market) => {
        const uAsset = supportedAssets.filter(
          (asset) => asset.mintAddress === market.underlyingAssetMint,
        )[0];

        const qAsset = supportedAssets.filter(
          (asset) => asset.mintAddress === market.quoteAssetMint,
        )[0];

        // BN.js doesn't handle decimals while bignumber.js can handle decimals of arbitrary sizes
        // So convert all BN types to BigNumber
        const amountPerContract = new BigNumber(
          market.underlyingAssetPerContract,
        ).div(10 ** uAsset?.decimals);

        const quoteAmountPerContract = new BigNumber(
          market.quoteAssetPerContract,
        ).div(10 ** qAsset?.decimals);

        const strike = quoteAmountPerContract.div(
          amountPerContract.toString(10),
        );

        const newMarket: OptionMarket = {
          key: `${market.expiration}-${uAsset?.tokenSymbol}-${
            qAsset?.tokenSymbol
          }-${amountPerContract.toString()}-${amountPerContract.toString()}/${quoteAmountPerContract.toString()}`,
          pubkey: new PublicKey(market.optionMarketAddress),
          amountPerContract,
          amountPerContractBN: new BN(market.underlyingAssetPerContract),
          quoteAmountPerContract,
          quoteAmountPerContractBN: new BN(market.quoteAssetPerContract),
          size: `${amountPerContract.toString(10)}`,
          uAssetSymbol: uAsset?.tokenSymbol,
          qAssetSymbol: qAsset?.tokenSymbol,
          uAssetMint: uAsset?.mintAddress,
          qAssetMint: qAsset?.mintAddress,
          strike,
          optionMarketKey: new PublicKey(market.optionMarketAddress),
          expiration: market.expiration,
          optionMintKey: new PublicKey(market.optionContractMintAddress),
          writerTokenMintKey: new PublicKey(
            market.optionWriterTokenMintAddress,
          ),
          underlyingAssetPoolKey: new PublicKey(
            market.underlyingAssetPoolAddress,
          ),
          underlyingAssetMintKey: new PublicKey(market.underlyingAssetMint),
          quoteAssetPoolKey: new PublicKey(market.quoteAssetPoolAddress),
          quoteAssetMintKey: new PublicKey(market.quoteAssetMint),
          serumMarketKey: new PublicKey(market.serumMarketAddress),
          psyOptionsProgramId: market.psyOptionsProgramId,
          serumProgramId: market.serumProgramId,
        };

        const key = `${newMarket.expiration}-${newMarket.uAssetSymbol}-${
          newMarket.qAssetSymbol
        }-${newMarket.size}-${amountPerContract.toString(
          10,
        )}/${quoteAmountPerContract.toString(10)}`;

        newMarketsByUiKey[key] = newMarket;
        newMarketsBySerumKey[market.serumMarketAddress] = newMarket;
      });
      // Not sure if we should replace the existing markets or merge them
      setMarkets(newMarketsByUiKey);
      setMarketsBySerumKey(newMarketsBySerumKey);
      setMarketsLoading(false);
      return newMarketsByUiKey;
    } catch (err) {
      console.error(err);
      setMarketsLoading(false);
    }
    return {};
  }, [connection, fetchMarketData, supportedAssets, endpoint]); // eslint-disable-line

  const mint = useCallback(
    async ({
      marketData,
      mintedOptionDestKey, // address in user's wallet to send minted Option Token to
      underlyingAssetSrcKey, // account in user's wallet to post uAsset collateral from
      writerTokenDestKey, // address in user's wallet to send the minted Writer Token
      existingTransaction: { transaction, signers }, // existing transaction and signers
      numberOfContracts,
    }) => {
      if (!wallet?.publicKey || !program || !connection) {
        return;
      }
      try {
        const tx = transaction;

        const { transaction: mintTx } = await mintInstructions(
          numberOfContracts,
          marketData,
          wallet.publicKey,
          new PublicKey(marketData.psyOptionsProgramId),
          mintedOptionDestKey,
          writerTokenDestKey,
          underlyingAssetSrcKey,
          program,
        );

        tx.add(mintTx);
        // Close out the wrapped SOL account so it feels native
        if (marketData.uAssetMint === WRAPPED_SOL_ADDRESS) {
          tx.add(
            Token.createCloseAccountInstruction(
              TOKEN_PROGRAM_ID,
              underlyingAssetSrcKey,
              wallet.publicKey, // Send any remaining SOL to the owner
              wallet.publicKey,
              [],
            ),
          );
        }

        sendTransaction({
          transaction: tx,
          wallet,
          signers,
          connection,
          sendingMessage: 'Processing: Mint Options Token',
          successMessage: 'Confirmed: Mint Options Token',
        });

        return {
          optionTokenDestKey: mintedOptionDestKey,
          writerTokenDestKey,
        };
      } catch (err) {
        console.log(err);
        pushErrorNotification(err);
      }
      return {};
    },
    [wallet, program, connection, sendTransaction, pushErrorNotification],
  );

  return {
    marketsByUiKey,
    marketsLoading,
    setMarkets,
    marketsBySerumKey,
    setMarketsBySerumKey,
    setMarketsLoading,
    mint,
    fetchMarketData,
    packagedMarkets,
  };
};

export default useOptionsMarkets;
