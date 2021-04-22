import React, { useCallback, useEffect, useState } from 'react'
import Box from '@material-ui/core/Box'
import Table from '@material-ui/core/Table'
// import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
// import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import TableBody from '@material-ui/core/TableBody'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'

import type { Market } from '@mithraic-labs/serum'

import useSerum from '../../hooks/useSerum'
import useWallet from '../../hooks/useWallet'
import useConnection from '../../hooks/useConnection'

import theme from '../../utils/theme'

type MarketObject = {
  loading: boolean
  error: string | undefined
  serumMarket: Market | null
}

const TCell = withStyles({
  root: {
    padding: '8px 16px',
    whiteSpace: 'nowrap',
    fontSize: '11px',
    border: 'none',
    height: '52px',
    background: theme.palette.background.medium,
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

const OpenOrders: React.VFC<{
  markets: string[]
}> = ({ markets }) => {
  const { connection } = useConnection()
  const { pubKey, connected } = useWallet()
  const { serumMarkets } = useSerum()
  const [openOrdersLoading, setOpenOrdersLoading] = useState(false)
  const [openOrders, setOpenOrders] = useState({})

  const serumMarketsLoading = Object.values(serumMarkets).some(
    (market: MarketObject) => market.loading === true,
  )
  const loadOpenOrders = useCallback(() => {
    if (!connected || !pubKey || !connection) return

    // Wait until all markets are done loading initially to load open orders
    if (serumMarketsLoading) return

    setOpenOrdersLoading(true)
    ;(async () => {
      await Promise.all(
        Object.keys(serumMarkets).map(async (key) => {
          const { loading, error, serumMarket } = serumMarkets[key]
          if (loading || error || !serumMarket?.market) return

          const orders = await serumMarket.market.loadOrdersForOwner(
            connection,
            pubKey,
          )

          if (orders.length > 0) {
            setOpenOrders((prevState) => ({ ...prevState, [key]: orders }))
          }
        }),
      )

      setOpenOrdersLoading(false)
    })()
  }, [serumMarkets, pubKey, connected, connection, serumMarketsLoading])

  useEffect(() => {
    loadOpenOrders()
  }, [loadOpenOrders])

  // TODO add the types here
  const flatOpenOrders = Object.values(openOrders).reduce(
    (flat: Array<any>, orders: Array<any>) => [...flat, ...orders],
    [],
  ) as Array<any>

  // TODO: only show open orders of markets currently being displayed

  return (
    <Box>
      <Table stickyHeader aria-label="sticky table">
        <TableHead>
          <TableRow>
            <TableCell colSpan={9}>
              <h3 style={{ margin: 0 }}>Open Orders</h3>
            </TableCell>
          </TableRow>
          <TableRow>
            <THeadCell>Side</THeadCell>
            <THeadCell>Option Type</THeadCell>
            <THeadCell>Underlying Asset</THeadCell>
            <THeadCell>Expiration</THeadCell>
            <THeadCell>Contract Size</THeadCell>
            <THeadCell>Order Size</THeadCell>
            <THeadCell>Price</THeadCell>
            <THeadCell>Filled</THeadCell>
            <THeadCell align="right">Action</THeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {openOrdersLoading || serumMarketsLoading ? (
            <TableRow>
              <TCell colSpan={9}>Loading Open Orders...</TCell>
            </TableRow>
          ) : (
            flatOpenOrders.map((order) => {
              return (
                <TableRow key={JSON.stringify(order)}>
                  <TCell>{order?.side}</TCell>
                  <TCell>TODO</TCell>
                  <TCell>TODO</TCell>
                  <TCell>TODO</TCell>
                  <TCell>TODO</TCell>
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
          )}
        </TableBody>
      </Table>
    </Box>
  )
}

export { OpenOrders }
