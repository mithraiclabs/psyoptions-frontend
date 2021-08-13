import React, { useEffect, useState } from 'react'
import Box from '@material-ui/core/Box'
import Table from '@material-ui/core/Table'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import TableBody from '@material-ui/core/TableBody'
import TableContainer from '@material-ui/core/TableContainer'
import { OpenOrders as SerumOpenOrdersClass } from '@mithraic-labs/serum'

import useSerum from '../../hooks/useSerum'
import useWallet from '../../hooks/useWallet'
import useConnection from '../../hooks/useConnection'
import {
  SerumOpenOrders,
  useSerumOpenOrders,
} from '../../context/SerumOpenOrdersContext'

import ConnectButton from '../ConnectButton'
import OpenOrdersForMarket from './OpenOrdersForMarket'
import { TCell, THeadCell } from './OpenOrderStyles'
import { CallOrPut } from '../../types'

// Render all open orders for all optionMarkets specified in props
const OpenOrders: React.FC<{
  optionMarkets: CallOrPut[]
}> = ({ optionMarkets }) => {
  const { connection, dexProgramId } = useConnection()
  const { wallet, pubKey, connected } = useWallet()
  const { serumMarkets } = useSerum()
  const [openOrders, setOpenOrders] = useSerumOpenOrders()
  const [openOrdersLoaded, setOpenOrdersLoaded] = useState(false)

  /**
   * Load open orders for each serum market if we haven't already done so
   */
  useEffect(() => {
    if (
      connection &&
      serumMarkets &&
      pubKey &&
      openOrders &&
      !openOrdersLoaded
    ) {
      const serumKeys = Object.keys(serumMarkets)
      ;(async () => {
        // TODO - find open orders for EACH serum dex program in optionMarkets
        const openOrdersRes = await SerumOpenOrdersClass.findForOwner(
          connection,
          pubKey,
          dexProgramId,
        )
        const newOpenOrders: SerumOpenOrders = {}
        serumKeys.forEach((serumMarketAddress) => {
          const orders = openOrdersRes.filter(
            (openOrder) => openOrder.market.toString() === serumMarketAddress,
          )
          newOpenOrders[serumMarketAddress] = {
            loading: false,
            error: null,
            orders,
          }
        })
        setOpenOrders((prevOpenOrders) => ({
          ...prevOpenOrders,
          ...newOpenOrders,
        }))
        setOpenOrdersLoaded(true)
      })()
    }
  }, [
    connection,
    dexProgramId,
    serumMarkets,
    wallet,
    pubKey,
    openOrders,
    setOpenOrders,
    openOrdersLoaded,
  ])

  const openOrdersArray = optionMarkets
    .map((optionMarket) => {
      if (optionMarket?.serumMarketKey) {
        return optionMarket
      }
      return undefined
    })
    .filter((item) => !!item)

  return (
    <Box mt={'20px'}>
      <TableContainer>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <THeadCell
                colSpan={10}
                style={{ borderTop: 'none', padding: '16px 20px' }}
              >
                <h3 style={{ margin: 0 }}>Open Orders</h3>
              </THeadCell>
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
              openOrdersArray.map((optionMarket) => (
                <OpenOrdersForMarket
                  {...optionMarket}
                  key={optionMarket.serumMarketKey.toString()}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default React.memo(OpenOrders)
