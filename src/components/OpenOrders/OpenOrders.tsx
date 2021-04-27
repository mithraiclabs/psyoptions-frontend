import React, { useCallback, useEffect, useState } from 'react'
import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'
import Table from '@material-ui/core/Table'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import TableBody from '@material-ui/core/TableBody'
import Button from '@material-ui/core/Button'
import Link from '@material-ui/core/Link'
import { withStyles } from '@material-ui/core/styles'

import moment from 'moment'

import type { Market } from '@mithraic-labs/serum'

import useSerum from '../../hooks/useSerum'
import useWallet from '../../hooks/useWallet'
import useConnection from '../../hooks/useConnection'
import useNotifications from '../../hooks/useNotifications'

import theme from '../../utils/theme'
import { buildSolanaExplorerUrl } from '../../utils/solanaExplorer'
import ConnectButton from '../ConnectButton'
import Loading from '../Loading'

type CallOrPut = {
  expiration: number
  serumKey: string
  size: number
  type: string
  qAssetSymbol: string
  uAssetSymbol: string
}

type MarketObject = {
  loading: boolean
  error: string | undefined
  serumMarket: Market | null
}

const TCell = withStyles({
  root: {
    padding: '8px 16px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    border: 'none',
    height: '52px',
    background: (theme.palette.background as any).medium, // Todo fix this type
  },
})(TableCell)

const THeadCell = withStyles({
  root: {
    padding: '4px 16px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    height: '48px',
    border: 'none',
  },
})(TableCell)

const OpenOrders: React.FC<{
  optionMarkets: CallOrPut[]
}> = ({ optionMarkets }) => {
  const { connection } = useConnection()
  const { pushNotification } = useNotifications()
  const { wallet, pubKey, connected } = useWallet()
  const { serumMarkets } = useSerum()
  const [openOrdersLoading, setOpenOrdersLoading] = useState(false)
  const [openOrders, setOpenOrders] = useState({})

  const serumMarketsLoading = Object.values(serumMarkets).some(
    (serumMarket: MarketObject) => serumMarket?.loading === true,
  )

  console.log('rerendered Open Orders')

  const loadOpenOrders = useCallback(() => {
    if (!connected || !pubKey || !connection || serumMarketsLoading) {
      return
    }
    console.log('loading open orders')
    setOpenOrdersLoading(true)
    const fetchOrders = async () => {
      const newOrders = {}
      await Promise.all(
        optionMarkets.map(async (optionMarket) => {
          const key = optionMarket?.serumKey
          const { loading, error, serumMarket } = serumMarkets[key] || {}
          if (loading || error || !serumMarket?.market) return

          const orders = await serumMarket.market.loadOrdersForOwner(
            connection,
            pubKey,
          )

          if (orders.length > 0) {
            newOrders[key] = orders
          }
        }),
      )
      setOpenOrders(newOrders)
      setOpenOrdersLoading(false)
    }
    fetchOrders()
  }, [
    optionMarkets,
    serumMarkets,
    pubKey,
    connected,
    connection,
    serumMarketsLoading,
  ])

  useEffect(() => {
    loadOpenOrders()
  }, [loadOpenOrders])

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

        setOpenOrders((prevState) => ({
          ...prevState,
          [serumKey]: prevState[serumKey].filter(
            (prevOrder) => prevOrder !== order,
          ),
        }))
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
          ) : openOrdersLoading || serumMarketsLoading ? (
            <TableRow>
              <TCell colSpan={10}>
                <Loading />
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

              const orders = openOrders[serumKey]

              return (
                orders &&
                orders.map((order) => {
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
