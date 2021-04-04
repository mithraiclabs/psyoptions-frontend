import React, { useCallback } from "react"

import useNotifications from './useNotifications'
import useOptionsMarkets from './useOptionsMarkets'
import useConnection from './useConnection'
import useWallet from './useWallet'

const usePlaceSellOrder = () => {
  const { createAccountsAndMint } = useOptionsMarkets()
  const { wallet, pubKey } = useWallet()
  const { connection } = useConnection()

  return useCallback(async (contractsToMint, createAccountsAndMintArgs, {serumMarket, orderArgs}) => {
    // Mint and place order
    if (contractsToMint > 0) {
      // Mint missing contracs before placing order
      // TODO refactor to make this a single TX
      await createAccountsAndMint(createAccountsAndMintArgs)
    }

    const {transaction: placeOrderTx, signers: placeOrderSigners} = await serumMarket.createPlaceOrderTx({ 
      ...{connection}, 
      ...orderArgs
    })

    const signers = placeOrderSigners;

    placeOrderTx.feePayer = pubKey
    const { blockhash } = await connection.getRecentBlockhash()
    placeOrderTx.recentBlockhash = blockhash

    if (signers.length) {
      placeOrderTx.partialSign(...signers)
    }
    const signed = await wallet.signTransaction(placeOrderTx)
    const txid = await connection.sendRawTransaction(signed.serialize())

    console.log('*** PROCESSING TXID ', txid)
    await connection.confirmTransaction(txid)
    console.log('*** CONFIRMED TXID ', txid)


  }, [connection, createAccountsAndMint, pubKey, wallet])
};

export default usePlaceSellOrder;
