import { useCallback } from 'react'
import { PublicKey, Transaction } from '@solana/web3.js'

import { SerumMarket } from 'src/utils/serum'
import { OrderParams } from '@mithraic-labs/serum/lib/market'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Asset, OptionMarket, TokenAccount } from '../types'
import { WRAPPED_SOL_ADDRESS } from '../utils/token'
import useNotifications from './useNotifications'
import useSendTransaction from './useSendTransaction'
import useOwnedTokenAccounts from './useOwnedTokenAccounts'
import { useSolanaMeta } from '../context/SolanaMetaContext'
import useConnection from './useConnection'
import useWallet from './useWallet'
import { createMissingAccountsAndMint } from '../utils/instructions/index'
import { useCreateAdHocOpenOrdersSubscription, useSettleFunds } from './Serum'

// Solana has a maximum packet size when sending a transaction.
// As of writing 25 mints is a good round number that won't
// breach that limit when OptionToken and WriterToken accounts
// are included in TX.
const MAX_MINTS_PER_TX = 25

type PlaceSellOrderArgs = {
  numberOfContractsToMint: number
  serumMarket: SerumMarket
  orderArgs: OrderParams
  optionMarket: OptionMarket
  uAsset: Asset
  uAssetTokenAccount: TokenAccount
  mintedOptionDestinationKey?: PublicKey
  writerTokenDestinationKey?: PublicKey
  settleFunds?: boolean
}

const usePlaceSellOrder = (
  serumKey: string,
): ((obj: PlaceSellOrderArgs) => Promise<void>) => {
  const { pushErrorNotification } = useNotifications()
  const { wallet, pubKey } = useWallet()
  const { connection, endpoint } = useConnection()
  const { splTokenAccountRentBalance } = useSolanaMeta()
  const { subscribeToTokenAccount } = useOwnedTokenAccounts()
  const { sendSignedTransaction } = useSendTransaction()
  const createAdHocOpenOrdersSub =
    useCreateAdHocOpenOrdersSubscription(serumKey)
  const { makeSettleFundsTx } = useSettleFunds(serumKey)

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
      settleFunds,
    }: PlaceSellOrderArgs) => {
      try {
        const mintTXs = []
        const mintSigners = []
        let _uAssetTokenAccount = uAssetTokenAccount
        let _optionTokenSrcKey = mintedOptionDestinationKey
        let _writerTokenDestinationKey = writerTokenDestinationKey
        let numberOfContractsDistribution

        // Mint and place order
        if (numberOfContractsToMint > 0) {
          /* Transactions are limited to certain packet size, so we must chunk the transactions
           * if the user wants to mint many contracts at once. */
          const numberOfMintTxs = Math.ceil(
            numberOfContractsToMint / MAX_MINTS_PER_TX,
          )

          numberOfContractsDistribution = new Array(numberOfMintTxs - 1).fill(
            MAX_MINTS_PER_TX,
          )
          /* Push the remaining contracts. If the mod is 0 then we know the total number of 
          is a multiple of MAX_MINTS_PER_TX so we push that */
          numberOfContractsDistribution.push(
            numberOfContractsToMint % MAX_MINTS_PER_TX || MAX_MINTS_PER_TX,
          )
          /**
           * Create a mintTX
           * @param {number} contractsToMint
           * @returns
           */
          const handleMintIteration = async (contractsToMint) => {
            const tx = new Transaction()
            // Mint missing contracs before placing order
            const { error, response } = await createMissingAccountsAndMint({
              optionsProgramId: new PublicKey(endpoint.programId),
              authorityPubkey: pubKey,
              owner: pubKey,
              market: optionMarket,
              uAsset,
              uAssetTokenAccount: _uAssetTokenAccount,
              splTokenAccountRentBalance,
              numberOfContractsToMint: contractsToMint,
              mintedOptionDestinationKey: _optionTokenSrcKey,
              writerTokenDestinationKey: _writerTokenDestinationKey,
            })
            if (error) {
              // eslint-disable-next-line no-console
              console.error(error)
              pushErrorNotification(error)
              return
            }
            const {
              transaction: createAndMintTx,
              signers: createAndMintSigners,
              mintedOptionDestinationKey: _mintedOptionDestinationKey,
              writerTokenDestinationKey: __writerTokenDestinationKey,
              uAssetTokenAccount: __uAssetTokenAccount,
            } = response
            _uAssetTokenAccount = __uAssetTokenAccount
            subscribeToTokenAccount(__writerTokenDestinationKey)
            subscribeToTokenAccount(_mintedOptionDestinationKey)

            // Add the create accounts and mint instructions to the TX
            tx.add(createAndMintTx)

            // must overwrite the original payer (aka option src) in case the
            // option(s) were minted to a new Account
            _optionTokenSrcKey = _mintedOptionDestinationKey
            _writerTokenDestinationKey = __writerTokenDestinationKey

            // Close out the wrapped SOL account so it feels native
            if (optionMarket.uAssetMint === WRAPPED_SOL_ADDRESS) {
              tx.add(
                Token.createCloseAccountInstruction(
                  TOKEN_PROGRAM_ID,
                  _uAssetTokenAccount.pubKey,
                  pubKey, // Send any remaining SOL to the owner
                  pubKey,
                  [],
                ),
              )
            }
            mintTXs.push(tx)
            mintSigners.push(createAndMintSigners)
          }
          /* If the user does not have an OptionToken or WriterToken account we need to pull one 
          TX out of the iteration so those account addresses are set and all of the contracts 
          and writer tokens end up in the same account. */
          if (!mintedOptionDestinationKey || !writerTokenDestinationKey) {
            await handleMintIteration(numberOfContractsDistribution[0])
          }

          await Promise.all(
            numberOfContractsDistribution.map(
              async (contractsToMint, index) => {
                /* if there's already a mintTX then the user must have been missing an OptionToken 
              account or WriterToken account. So we should skip the first iteration */
                if (index === 0 && mintTXs.length) {
                  return null
                }
                return handleMintIteration(contractsToMint)
              },
            ),
          )
        }

        const {
          createdOpenOrdersKey,
          transaction: placeOrderTx,
          signers: placeOrderSigners,
        } = await serumMarket.market.makePlaceOrderTransaction(connection, {
          ...orderArgs,
          payer: _optionTokenSrcKey,
        })

        if (createdOpenOrdersKey) {
          createAdHocOpenOrdersSub(createdOpenOrdersKey)
        }

        const { blockhash } = await connection.getRecentBlockhash()

        mintTXs.forEach((_mintTx, index) => {
          mintTXs[index].feePayer = pubKey
          mintTXs[index].recentBlockhash = blockhash
          if (mintSigners[index].length) {
            mintTXs[index].partialSign(...mintSigners[index])
          }
        })
        placeOrderTx.feePayer = pubKey
        placeOrderTx.recentBlockhash = blockhash

        if (placeOrderSigners.length) {
          placeOrderTx.partialSign(...placeOrderSigners)
        }

        const settleFundsTx = settleFunds ? await makeSettleFundsTx() : null

        const signed = await wallet.signAllTransactions(
          settleFunds
            ? [...mintTXs, placeOrderTx, settleFundsTx]
            : [...mintTXs, placeOrderTx],
        )

        const signedSettleFundsTx = settleFunds ? signed.pop() : null

        /* If the user did not have an OptionToken or WriterToken account then we need to pull the 
        first TX out of the iteration so we can guarantee the accounts are created and initialized 
        before the other TXs execute */
        if (
          !mintedOptionDestinationKey ||
          (!writerTokenDestinationKey && numberOfContractsDistribution?.length)
        ) {
          const contractsMinted = numberOfContractsDistribution.shift()
          mintTXs.shift()
          const tx = signed.shift()

          await sendSignedTransaction({
            signedTransaction: tx,
            connection,
            sendingMessage: `Processing: Write ${contractsMinted} contract${
              numberOfContractsToMint > 1 ? 's' : ''
            }`,
            successMessage: `Confirmed: Write ${contractsMinted} contract${
              numberOfContractsToMint > 1 ? 's' : ''
            }`,
          })
        }

        await Promise.all(
          mintTXs.map(async (_mintTx, index) =>
            sendSignedTransaction({
              signedTransaction: signed[index],
              connection,
              sendingMessage: `Processing: Write ${
                numberOfContractsDistribution[index]
              } contract${numberOfContractsToMint > 1 ? 's' : ''}`,
              successMessage: `Confirmed: Write ${
                numberOfContractsDistribution[index]
              } contract${numberOfContractsToMint > 1 ? 's' : ''}`,
            }),
          ),
        )

        await sendSignedTransaction({
          signedTransaction: signed[signed.length - 1],
          connection,
          sendingMessage: `Processing: Sell ${orderArgs.size} contract${
            numberOfContractsToMint > 1 ? 's' : ''
          }`,
          successMessage: `Confirmed: Sell ${orderArgs.size} contract${
            numberOfContractsToMint > 1 ? 's' : ''
          }`,
        })

        if (settleFunds) {
          await sendSignedTransaction({
            signedTransaction: signedSettleFundsTx,
            connection,
            sendingMessage: `Processing: Settle funds`,
            successMessage: `Confirmed: Settle funds`,
          })
        }
      } catch (err) {
        pushErrorNotification(err)
      }
    },
    [
      connection,
      createAdHocOpenOrdersSub,
      endpoint.programId,
      pubKey,
      pushErrorNotification,
      sendSignedTransaction,
      splTokenAccountRentBalance,
      subscribeToTokenAccount,
      wallet,
      makeSettleFundsTx,
    ],
  )
}

export default usePlaceSellOrder
