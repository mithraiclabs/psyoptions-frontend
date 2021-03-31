import React, { useCallback } from "react";
import { Link } from '@material-ui/core'
import { initializeTokenAccountTx } from "../utils/token";
import useConnection from "./useConnection";
import useNotifications from "./useNotifications";
import useWallet from "./useWallet";
import { buildSolanaExplorerUrl } from "../utils/solanaExplorer";

export const useCreateNewTokenAccount = () => {
  const { connection } = useConnection()
  const { wallet, pubKey } = useWallet()
  const { pushNotification } = useNotifications()

  return useCallback(async (mintKey, accountName) => {
    const {transaction, signers} = await initializeTokenAccountTx({
      connection,
      payer: { publicKey: pubKey },
      mintPublicKey: mintKey,
      owner: pubKey,
    })
    const signed = await wallet.signTransaction(transaction)
    const txid = await connection.sendRawTransaction(signed.serialize())
  
    pushNotification({
      severity: 'info',
      message: `Processing: Create ${accountName} Account`,
      link: (
        <Link href={buildSolanaExplorerUrl(txid)} target="_new">
          View on Solana Explorer
        </Link>
      ),
    })
  
    await connection.confirmTransaction(txid)
    
    // TODO: maybe we can send a name for this account in the wallet too, would be nice
    
    pushNotification({
      severity: 'success',
      message: `Confirmed: Create ${accountName} Account`,
      link: (
        <Link href={buildSolanaExplorerUrl(txid)} target="_new">
          View on Solana Explorer
        </Link>
      ),
    })
    return signers[0].publicKey.toString()
  }, [connection, pubKey, pushNotification, wallet])
}