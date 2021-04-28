import React, { useCallback, useEffect, useState, useContext } from 'react'
import Box from '@material-ui/core/Box'
import Table from '@material-ui/core/Table'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import TableBody from '@material-ui/core/TableBody'
import Button from '@material-ui/core/Button'
import Link from '@material-ui/core/Link'
import { withStyles } from '@material-ui/core/styles'

import moment from 'moment'

import useSerum from '../../hooks/useSerum'
import useWallet from '../../hooks/useWallet'
import useConnection from '../../hooks/useConnection'
import useNotifications from '../../hooks/useNotifications'
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext'
import { useSerumOrderbooks } from '../../context/SerumOrderbookContext'

import { buildSolanaExplorerUrl } from '../../utils/solanaExplorer'
import theme from '../../utils/theme'

import ConnectButton from '../ConnectButton'

type CallOrPut = {
  expiration: number
  serumKey: string
  size: number
  type: string
  qAssetSymbol: string
  uAssetSymbol: string
}

const TCell = withStyles({
  root: {
    padding: '8px 16px',
    whiteSpace: 'nowrap',
    fontSize: '11px',
    border: 'none',
    height: '52px',
    background: (theme.palette.background as any).medium, // Todo fix this type
  },
})(TableCell)

const THeadCell = withStyles({
  root: {
    padding: '4px 16px',
    whiteSpace: 'nowrap',
    fontSize: '11px',
    height: '48px',
    border: 'none',
  },
})(TableCell)

const OpenOrders: React.FC<{
  /**
   * Which options markets to display the open orders for
   */
  optionMarkets: CallOrPut[]
}> = ({ optionMarkets }) => {
  const { connection } = useConnection()
  const { pushNotification } = useNotifications()
  const { wallet, pubKey, connected } = useWallet()
  const { serumMarkets } = useSerum()

  const [orderbooks] = useSerumOrderbooks()
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

  const handleCancel = async ({ order, serumKey }) => {
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

        // TODO - subscribe to open orders so that after someone cancels an order here, it gets removed from the openOrders
        // Gonna have to refactor the subscribe hooks a little to not just be on-mount for a single serum market
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
            <THeadCell>Filled</THeadCell>
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
              const {
                expiration,
                size: contractSize,
                type,
                qAssetSymbol,
                uAssetSymbol,
                serumKey,
              } = optionMarket

              const serumMarket = serumMarkets[serumKey]?.serumMarket?.market

              if (
                !serumMarket ||
                !openOrders[serumKey]?.orders ||
                !orderbooks[serumKey]
              ) {
                return null
              }

              const { bidOrderbook = [], askOrderbook = [] } = orderbooks[
                serumKey
              ]
              const actualOpenOrders = serumMarket.filterForOpenOrders(
                bidOrderbook,
                askOrderbook,
                openOrders[serumKey].orders,
              )

              return (
                actualOpenOrders &&
                actualOpenOrders.map((order) => {
                  return (
                    <TableRow key={JSON.stringify(order)}>
                      <TCell>{order?.side}</TCell>
                      <TCell>{type}</TCell>
                      <TCell>{`${qAssetSymbol}/${uAssetSymbol}`}</TCell>
                      <TCell>
                        {`${moment
                          .utc(expiration * 1000)
                          .format('LL')} 23:59:59 UTC`}
                      </TCell>
                      <TCell>
                        {type === 'put' ? contractSize : 1 / contractSize}
                      </TCell>
                      <TCell>{`${contractSize} ${uAssetSymbol}`}</TCell>
                      <TCell>{order?.size}</TCell>
                      <TCell>{order?.price}</TCell>
                      <TCell>TODO</TCell>
                      <TCell align="right">
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() =>
                            handleCancel({
                              order,
                              serumKey,
                            })
                          }
                        >
                          Cancel
                        </Button>
                      </TCell>
                    </TableRow>
                  )
                })
              )
            })
          )}
        </TableBody>
      </Table>
    </Box>
  )
}

export default React.memo(OpenOrders)
