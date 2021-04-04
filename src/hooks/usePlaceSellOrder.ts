import { useCallback } from 'react'
import { PublicKey, Transaction } from '@solana/web3.js';

import { SerumMarket } from 'src/utils/serum';
import { OrderParams } from '@mithraic-labs/serum/lib/market';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Asset, OptionMarket, TokenAccount } from '../types';
import { WRAPPED_SOL_ADDRESS } from '../utils/token';
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
      let _uAssetTokenAccount = uAssetTokenAccount
      let _optionTokenSrcKey = orderArgs.payer

      // Mint and place order
      if (numberOfContractsToMint > 0) {

        // Mint missing contracs before placing order
        const {error, response} = await createMissingAccountsAndMint({
          optionsProgramId: new PublicKey(endpoint.programId),
          authorityPubkey: pubKey,
          owner: pubKey,
          market: optionMarket,
          uAsset,
          uAssetTokenAccount: _uAssetTokenAccount,
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
          uAssetTokenAccount: __uAssetTokenAccount,
        } = response;
        _uAssetTokenAccount = __uAssetTokenAccount

        // Add the create accounts and mint instructions to the TX
        transaction.add(createAndMintTx);
        signers = [...signers, ...createAndMintSigners]
        // must overwrite the original payer (aka option src) in case the
        // option(s) were minted to a new Account
        _optionTokenSrcKey = _mintedOptionDestinationKey
      }

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

      
      // Close out the wrapped SOL account so it feels native
      if (optionMarket.uAssetMint === WRAPPED_SOL_ADDRESS) {
        transaction.add(
          Token.createCloseAccountInstruction(
            TOKEN_PROGRAM_ID,
            _uAssetTokenAccount.pubKey,
            pubKey, // Send any remaining SOL to the owner
            pubKey,
            [],
          ),
        )
      }
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
