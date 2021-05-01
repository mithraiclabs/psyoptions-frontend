import React, { useCallback } from 'react'
import { Link } from '@material-ui/core'
import { initializeTokenAccountTx } from '../utils/token'
import useConnection from './useConnection'
import useNotifications from './useNotifications'
import useWallet from './useWallet'
import { buildSolanaExplorerUrl } from '../utils/solanaExplorer'
import { useSolanaMeta } from '../context/SolanaMetaContext'

export const useCreateNewTokenAccount = () => {
  const { connection } = useConnection()
  const { wallet, pubKey } = useWallet()
  const { pushNotification } = useNotifications()
  const { splTokenAccountRentBalance } = useSolanaMeta()

  return useCallback(
    async (mintKey, accountName) => {
      try {
        const [tx, newAccount] = await initializeTokenAccountTx({
          connection,
          payer: { publicKey: pubKey },
          mintPublicKey: mintKey,
          owner: pubKey,
          rentBalance: splTokenAccountRentBalance,
        })
        const signed = await wallet.signTransaction(tx)
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
        return newAccount.publicKey.toString()
      } catch (err) {
        pushNotification({
          severity: 'error',
          message: `${err}`,
        })
      }
      return null
    },
    [connection, pubKey, pushNotification, splTokenAccountRentBalance, wallet],
  )
}
