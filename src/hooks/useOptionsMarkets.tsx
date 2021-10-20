import { useContext, useCallback } from 'react';
import BigNumber from 'bignumber.js';
import {
  getAllOptionAccounts,
  OptionMarketWithKey as AmericanOptionData,
} from '@mithraic-labs/psy-american';
import { Connection, PublicKey } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { BN } from '@project-serum/anchor';
import useNotifications from './useNotifications';
import useWallet from './useWallet';
import useConnection from './useConnection';
import useAssetList from './useAssetList';
import useSendTransaction from './useSendTransaction';

import { OptionsMarketsContext } from '../context/OptionsMarketsContext';
import { useSolanaMeta } from '../context/SolanaMetaContext';

import { WRAPPED_SOL_ADDRESS } from '../utils/token';
import {
  createMissingMintAccounts,
  mintInstructions,
} from '../utils/instructions/index';

import { ClusterName, CreateMissingMintAccountsRes, OptionMarket } from '../types';
import { getSupportedMarketsByNetwork } from '../utils/networkInfo';
import { findMarketByAssets } from '../utils/serum';
import { useAmericanPsyOptionsProgram } from './useAmericanPsyOptionsProgram';

const useOptionsMarkets = () => {
  const program = useAmericanPsyOptionsProgram();
  const { pushErrorNotification, pushNotification } = useNotifications();
  const { wallet, pubKey } = useWallet();
  const { connection, dexProgramId, endpoint } = useConnection();
  const { splTokenAccountRentBalance } = useSolanaMeta();
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
      if (marketsLoading || !endpoint || !endpoint.programId || !program || !dexProgramId) return;
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

  const getSizes = useCallback(
    ({ uAssetSymbol, qAssetSymbol }) => {
      const keyPart = `-${uAssetSymbol}-${qAssetSymbol}-`;

      const sizes = Object.keys(marketsByUiKey)
        .filter((key) => key.match(keyPart))
        .map((key) => marketsByUiKey[key].size);

      return [...new Set(sizes)];
    },
    [marketsByUiKey],
  );

  const getSizesWithDate = useCallback(
    ({ uAssetSymbol, qAssetSymbol, date }) => {
      const keyPart = `${date}-${uAssetSymbol}-${qAssetSymbol}-`;

      const sizes = Object.keys(marketsByUiKey)
        .filter((key) => key.match(keyPart))
        .map((key) => marketsByUiKey[key].size);

      return [...new Set(sizes)];
    },
    [marketsByUiKey],
  );

  const getStrikePrices = useCallback(({ uAssetSymbol, qAssetSymbol, date, size }) => {
    const keyPart = `${date}-${uAssetSymbol}-${qAssetSymbol}-${size}-`;
    return Object.keys(marketsByUiKey)
      .filter((key) => key.match(keyPart))
      .map((key) => marketsByUiKey[key].strikePrice);
  }, [marketsByUiKey]);

  const getDates = useCallback(() => {
    const dates = Object.values(marketsByUiKey).map((m: OptionMarket) => m.expiration);
    const deduped = [...new Set(dates)];
    return deduped;
  }, [marketsByUiKey]);

  const mint = useCallback(async ({
    marketData,
    mintedOptionDestKey, // address in user's wallet to send minted Option Token to
    underlyingAssetSrcKey, // account in user's wallet to post uAsset collateral from
    writerTokenDestKey, // address in user's wallet to send the minted Writer Token
    existingTransaction: { transaction, signers }, // existing transaction and signers
    numberOfContracts,
  }) => {
    if (!pubKey || !program || !connection || !wallet) {
      return;
    }
    try {
      const tx = transaction;

      const { transaction: mintTx } = await mintInstructions(
        numberOfContracts,
        marketData,
        pubKey,
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
            pubKey, // Send any remaining SOL to the owner
            pubKey,
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
  }, [
    wallet,
    pubKey,
    program,
    connection,
    sendTransaction,
    pushErrorNotification
  ]);

  const createAccountsAndMint = useCallback(async ({
    date,
    uAsset,
    qAsset,
    size,
    price,
    uAssetAccount,
    mintedOptionAccount,
    ownedMintedOptionAccounts,
    mintedWriterTokenDestKey,
    numberOfContracts,
  }) => {
    if (!pubKey || !connection) {
      return;
    }

    const uAssetSymbol = uAsset.tokenSymbol;
    const qAssetSymbol = qAsset.tokenSymbol;

    const marketData =
      marketsByUiKey[`${date}-${uAssetSymbol}-${qAssetSymbol}-${size}-${price}`];

    // Fallback to first oowned minted option account
    const mintedOptionDestAddress =
      mintedOptionAccount || ownedMintedOptionAccounts[0];

    const writerTokenDestAddress = mintedWriterTokenDestKey;

    const { response, error } = await createMissingMintAccounts({
      owner: pubKey,
      market: marketData,
      uAsset,
      uAssetTokenAccount: uAssetAccount,
      splTokenAccountRentBalance: splTokenAccountRentBalance ?? null,
      mintedOptionDestinationKey: mintedOptionDestAddress,
      writerTokenDestinationKey: writerTokenDestAddress,
      numberOfContractsToMint: numberOfContracts,
      connection
    });
    if (error) {
      pushNotification(error);
      return {};
    }
    const {
      transaction,
      signers,
      mintedOptionDestinationKey,
      writerTokenDestinationKey,
      uAssetTokenAccount,
    } = response as CreateMissingMintAccountsRes;

    return mint({
      marketData,
      mintedOptionDestKey: mintedOptionDestinationKey,
      underlyingAssetSrcKey: uAssetTokenAccount.pubKey,
      writerTokenDestKey: writerTokenDestinationKey,
      existingTransaction: { transaction, signers },
      numberOfContracts,
    });
  }, [
    marketsByUiKey,
    pubKey,
    connection,
    splTokenAccountRentBalance,
    pushNotification,
    mint
  ]);

  return {
    marketsByUiKey,
    marketsLoading,
    setMarkets,
    marketsBySerumKey,
    setMarketsBySerumKey,
    setMarketsLoading,
    getStrikePrices,
    getSizes,
    getSizesWithDate,
    getDates,
    mint,
    createAccountsAndMint,
    fetchMarketData,
    packagedMarkets,
  };
};

export default useOptionsMarkets;
