import React, { useCallback, useEffect, useState } from 'react'
import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'
import Table from '@material-ui/core/Table'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import TableBody from '@material-ui/core/TableBody'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'

import moment from 'moment'

import type { Market } from '@mithraic-labs/serum'

import useSerum from '../../hooks/useSerum'
import useWallet from '../../hooks/useWallet'
import useConnection from '../../hooks/useConnection'

import theme from '../../utils/theme'
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
    background: theme.palette.background.medium,
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
  const { pubKey, connected } = useWallet()
  const { serumMarkets } = useSerum()
  const [openOrdersLoading, setOpenOrdersLoading] = useState(false)
  const [openOrders, setOpenOrders] = useState({})

  const serumMarketsLoading = optionMarkets
    .map((optionMarket) => serumMarkets[optionMarket?.serumKey])
    .some((market: MarketObject) => market?.loading === true)

  const loadOpenOrders = useCallback(() => {
    if (!connected || !pubKey || !connection) return

    // Wait until all markets are done loading initially to load open orders
    if (serumMarketsLoading) return

    setOpenOrdersLoading(true)
    ;(async () => {
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
            setOpenOrders((prevState) => ({
              ...prevState,
              [key]: orders,
            }))
          }
        }),
      )

      setOpenOrdersLoading(false)
    })()
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
                        <Button variant="outlined" color="primary">
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

export { OpenOrders }
