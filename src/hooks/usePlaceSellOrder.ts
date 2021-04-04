import React, { useCallback } from 'react'
import { PublicKey, Transaction } from '@solana/web3.js';

import { SerumMarket } from 'src/utils/serum';
import { OrderParams } from '@mithraic-labs/serum/lib/market';
import { Asset, OptionMarket, TokenAccount } from 'src/types';
import useNotifications from './useNotifications'
import { useSolanaMeta } from '../context/SolanaMetaContext'
import useConnection from './useConnection'
import useWallet from './useWallet'
import { createMissingAccountsAndMint } from '../utils/instructions/index'

const usePlaceSellOrder = () => {
  const { pushNotification } = useNotifications()
  const { wallet, pubKey } = useWallet()
  const { connection, endpoint } = useConnection()
  const { splTokenAccountRentBalance } = useSolanaMeta()

  return useCallback(
    async ({
      numberOfContractsToMint,
      serumMarket,
      orderArgs,
      optionMarket,
      uAsset,
      uAssetTokenAccount,
      mintedOptionDestinationKey,
      writerTokenDestinationKey,
    }: {
      numberOfContractsToMint: number;
      serumMarket: SerumMarket;
      orderArgs: OrderParams;
      optionMarket: OptionMarket;
      uAsset: Asset;
      uAssetTokenAccount: TokenAccount;
      mintedOptionDestinationKey?: PublicKey;
      writerTokenDestinationKey?: PublicKey;
    }) => {
      const transaction = new Transaction();
      let signers = [];
      let _optionTokenSrcKey = orderArgs.payer
      console.log('** original payer', orderArgs.payer);
      // Mint and place order
      if (numberOfContractsToMint > 0) {
        console.log(`*** need to make ${numberOfContractsToMint} contracts`)
        // Mint missing contracs before placing order
        const {error, response} = await createMissingAccountsAndMint({
          optionsProgramId: new PublicKey(endpoint.programId),
          authorityPubkey: pubKey,
          owner: pubKey,
          market: optionMarket,
          uAsset,
          uAssetTokenAccount,
          splTokenAccountRentBalance,
          numberOfContractsToMint,
          mintedOptionDestinationKey,
          writerTokenDestinationKey,
        })
        if (error) {
          console.error(error)
          pushNotification(error)
          return;
        }
        const {
          transaction: createAndMintTx,
          signers: createAndMintSigners,
          shouldRefreshTokenAccounts,
          mintedOptionDestinationKey: _mintedOptionDestinationKey,
          writerTokenDestinationKey: _writerTokenDestinationKey,
          uAssetTokenAccount: _uAssetTokenAccount,
        } = response;
        console.log('*** adding createAndMintTx TX', createAndMintTx);
        // Add the create accounts and mint instructions to the TX
        transaction.add(createAndMintTx);
        signers = [...signers, ...createAndMintSigners]
        // must overwrite the original payer (aka option src) in case the
        // option(s) were minted to a new Account
        _optionTokenSrcKey = _mintedOptionDestinationKey
      }
      console.log('*** orderArgs', _optionTokenSrcKey, {
        ...orderArgs,
        payer: _optionTokenSrcKey,
      });

      const {
        transaction: placeOrderTx,
        signers: placeOrderSigners,
      } = await serumMarket.market.makePlaceOrderTransaction(connection,
        {
        ...orderArgs,
        payer: _optionTokenSrcKey,
      })

      transaction.add(placeOrderTx)
      signers = [...signers, ...placeOrderSigners]

      console.log('*** TX', transaction, signers);

      transaction.feePayer = pubKey
      const { blockhash } = await connection.getRecentBlockhash()
      transaction.recentBlockhash = blockhash

      if (signers.length) {
        transaction.partialSign(...signers)
      }
      const signed = await wallet.signTransaction(transaction)
      const txid = await connection.sendRawTransaction(signed.serialize())

      await connection.confirmTransaction(txid)
    },
    [connection, endpoint, pubKey, pushNotification, splTokenAccountRentBalance, wallet],
  )
}

export default usePlaceSellOrder
