import React, { useEffect } from 'react'
import Box from '@material-ui/core/Box'
import Table from '@material-ui/core/Table'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import TableBody from '@material-ui/core/TableBody'
import Link from '@material-ui/core/Link'

import useSerum from '../../hooks/useSerum'
import useWallet from '../../hooks/useWallet'
import useConnection from '../../hooks/useConnection'
import useNotifications from '../../hooks/useNotifications'
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext'
import { buildSolanaExplorerUrl } from '../../utils/solanaExplorer'

import ConnectButton from '../ConnectButton'
import OpenOrdersForMarket from './OpenOrdersForMarket'
import { TCell, THeadCell } from './OpenOrderStyles'

type CallOrPut = {
  expiration: number
  serumKey: string
  size: number
  strikePrice: string
  type: string
  qAssetSymbol: string
  uAssetSymbol: string
}

// Render all open orders for all optionMarkets specified in props
const OpenOrders: React.FC<{
  optionMarkets: CallOrPut[]
}> = ({ optionMarkets }) => {
  const { connection } = useConnection()
  const { pushNotification } = useNotifications()
  const { wallet, pubKey, connected } = useWallet()
  const { serumMarkets } = useSerum()
  const [openOrders, setOpenOrders] = useSerumOpenOrders()

  /**
   * Load open orders for each serum market if we haven't already done so
   */
  useEffect(() => {
    if (connection && serumMarkets && pubKey && openOrders) {
      const serumKeys = Object.keys(serumMarkets)

      const fetchOpenOrders = async (key) => {
        const { serumMarket } = serumMarkets[key]
        if (serumMarket?.market) {
          const orders = await serumMarket.market.findOpenOrdersAccountsForOwner(
            connection,
            pubKey,
          )
          setOpenOrders((prevOpenOrders) => ({
            ...prevOpenOrders,
            [key]: {
              error: null,
              loading: false,
              orders,
            },
          }))
        }
      }

      serumKeys.forEach((key) => {
        const { loading, error } = serumMarkets[key]
        if (!openOrders[key] && !loading && !error) {
          // We have to set something here immediately
          // Or else it will try to load the open orders many extra times
          setOpenOrders((prev) => ({
            ...prev,
            [key]: {
              loading: true,
              error: null,
              orders: [],
            },
          }))
          fetchOpenOrders(key)
        }
      })
    }
  }, [connection, serumMarkets, wallet, pubKey, openOrders, setOpenOrders])

  // TODO: maybe move this handleCancelOrder function to a hook
  const handleCancelOrder = async ({ order, serumKey }) => {
    const { serumMarket } = serumMarkets[serumKey]
    if (serumMarket?.market) {
      try {
        const tx = await serumMarket.market.makeCancelOrderTransaction(
          connection,
          pubKey,
          order,
        )
        const { blockhash } = await connection.getRecentBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer = pubKey
        const signed = await wallet.signTransaction(tx)
        const txid = await connection.sendRawTransaction(signed.serialize())

        pushNotification({
          severity: 'info',
          message: `Submitted Transaction: Cancel Order`,
          link: (
            <Link href={buildSolanaExplorerUrl(txid)} target="_new">
              View on Solana Explorer
            </Link>
          ),
        })

        await connection.confirmTransaction(txid)

        pushNotification({
          severity: 'success',
          message: `Transaction Confirmed: Cancel Order`,
          link: (
            <Link href={buildSolanaExplorerUrl(txid)} target="_new">
              View on Solana Explorer
            </Link>
          ),
        })

        // We shouldn't have to update open orders state here because we will subscribe to changes
      } catch (err) {
        pushNotification({
          severity: 'error',
          message: `Transaction Failed: Cancel Order | Error: ${err}`,
        })
      }
    }
  }

  return (
    <Box>
      <Table stickyHeader aria-label="sticky table">
        <TableHead>
          <TableRow>
            <TableCell colSpan={10}>
              <h3 style={{ margin: 0 }}>Open Orders</h3>
            </TableCell>
          </TableRow>
          <TableRow>
            <THeadCell>Side</THeadCell>
            <THeadCell>Option Type</THeadCell>
            <THeadCell>Asset Pair</THeadCell>
            <THeadCell>Expiration</THeadCell>
            <THeadCell>Strike Price</THeadCell>
            <THeadCell>Contract Size</THeadCell>
            <THeadCell>Order Size</THeadCell>
            <THeadCell>Limit Price</THeadCell>
            {/* <THeadCell>Filled</THeadCell> */}
            <THeadCell align="right">Action</THeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!connected ? (
            <TableRow>
              <TCell align="center" colSpan={10}>
                <Box p={1}>
                  <ConnectButton>Connect Wallet</ConnectButton>
                </Box>
              </TCell>
            </TableRow>
          ) : (
            optionMarkets.map((optionMarket) => {
              if (optionMarket?.serumKey) {
                return (
                  <OpenOrdersForMarket
                    {...optionMarket}
                    handleCancelOrder={handleCancelOrder}
                    key={`${optionMarket.serumKey}`}
                  />
                )
              }
              return null
            })
          )}
        </TableBody>
      </Table>
    </Box>
  )
}

export default React.memo(OpenOrders)
