import React, { useCallback } from 'react'

import useNotifications from './useNotifications'
import useOptionsMarkets from './useOptionsMarkets'
import useConnection from './useConnection'
import useWallet from './useWallet'

const usePlaceSellOrder = () => {
  const { createAccountsAndMint } = useOptionsMarkets()
  const { wallet, pubKey } = useWallet()
  const { connection } = useConnection()

  return useCallback(
    async (
      contractsToMint,
      createAccountsAndMintArgs,
      { serumMarket, orderArgs },
    ) => {
      let _optionTokenSrcKey = orderArgs.payer
      // Mint and place order
      if (contractsToMint > 0) {
        // Mint missing contracs before placing order
        // TODO refactor to make this a single TX
        const { optionTokenDestKey } = await createAccountsAndMint(
          createAccountsAndMintArgs,
        )
        // must overwrite the original payer (aka option src) in case the
        // option(s) were minted to a new Account
        _optionTokenSrcKey = optionTokenDestKey
      }

      const {
        transaction: placeOrderTx,
        signers: placeOrderSigners,
      } = await serumMarket.createPlaceOrderTx({
        ...{ connection },
        ...orderArgs,
        payer: _optionTokenSrcKey,
      })

      const signers = placeOrderSigners

      placeOrderTx.feePayer = pubKey
      const { blockhash } = await connection.getRecentBlockhash()
      placeOrderTx.recentBlockhash = blockhash

      if (signers.length) {
        placeOrderTx.partialSign(...signers)
      }
      const signed = await wallet.signTransaction(placeOrderTx)
      const txid = await connection.sendRawTransaction(signed.serialize())

      await connection.confirmTransaction(txid)
    },
    [connection, createAccountsAndMint, pubKey, wallet],
  )
}

export default usePlaceSellOrder
