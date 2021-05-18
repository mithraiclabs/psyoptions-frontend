import { Box, FormControlLabel, Switch } from '@material-ui/core'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import { withStyles } from '@material-ui/core/styles'

import theme from '../../../utils/theme'
import { getLastFridayOfMonths } from '../../../utils/dates'
import { getStrikePrices, intervals } from '../../../utils/getStrikePrices'
import { getPriceFromSerumOrderbook } from '../../../utils/orderbook'

import { useBonfidaMarkPrice } from '../../../hooks/useBonfidaMarkPrice'
import useAssetList from '../../../hooks/useAssetList'
import useOptionsMarkets from '../../../hooks/useOptionsMarkets'
import useOptionsChain from '../../../hooks/useOptionsChain'
import useSerum from '../../../hooks/useSerum'
import {
  useSerumOrderbook,
  useSubscribeSerumOrderbook,
} from '../../../hooks/Serum'

import Page from '../Page'
import Select from '../../Select'
import SelectAsset from '../../SelectAsset'
import CallPutRow from './CallPutRow'
import BuySellDialog from '../../BuySellDialog'
import Loading from '../../Loading'
import RefreshButton from '../../RefreshButton'
import OpenOrders from '../../OpenOrders'
import { ContractSizeSelector } from '../../ContractSizeSelector'

const dblsp = `${'\u00A0'}${'\u00A0'}`

const THeadCell = withStyles({
  root: {
    padding: '4px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    height: '48px',
    border: 'none',
  },
})(TableCell)

const THeadCellStrike = withStyles({
  root: {
    padding: '4px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    height: '48px',
    border: 'none',
  },
})(TableCell)

const TCellLoading = withStyles({
  root: {
    padding: '16px',
    whiteSpace: 'nowrap',
    height: '48px',
    border: 'none',
  },
})(TableCell)

const TCellStrike = withStyles({
  root: {
    padding: '16px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    height: '48px',
    border: 'none',
    background: theme.palette.background.default,
  },
})(TableCell)

const rowTemplate = {
  call: {
    key: '',
    bid: '',
    ask: '',
    change: '',
    volume: '',
    openInterest: '',
    size: '',
    emptyRow: true,
    actionInProgress: false,
  },
  put: {
    key: '',
    bid: '',
    ask: '',
    change: '',
    volume: '',
    openInterest: '',
    size: '',
    emptyRow: true,
    actionInProgress: false,
  },
}

const expirations = getLastFridayOfMonths(10)

const USE_BONFIDA_MARK_PRICE = true

const defaultContractSizes = {
  BTC: 1,
  other: 100,
}

const Markets = () => {
  const { uAsset, qAsset, setUAsset, assetListLoading } = useAssetList()
  const [date, setDate] = useState(expirations[0])
  const [contractSize, setContractSize] = useState(100)
  const { chain, buildOptionsChain } = useOptionsChain()
  const { marketsLoading, fetchMarketData } = useOptionsMarkets()
  const { serumMarkets, fetchSerumMarket } = useSerum()
  const [round, setRound] = useState(true)
  const [buySellDialogOpen, setBuySellDialogOpen] = useState(false)
  const [callPutData, setCallPutData] = useState({ type: 'call' })
  const [showAllStrikes] = useState(true) // TODO: let user configure this

  // Unfortunately we need to set contract size in a useEffect because uAsset is asynchronously loaded
  useEffect(() => {
    setContractSize(
      defaultContractSizes[uAsset?.tokenSymbol] || defaultContractSizes.other,
    )
  }, [uAsset])

  // mainnet mark price from bonfida
  const bonfidaMarkPrice = useBonfidaMarkPrice({
    uAsset,
    qAsset,
  })

  const underlyingSerumMarketKey = `${uAsset?.mintAddress}-${qAsset?.mintAddress}`
  const { orderbook: underlyingOrderbook } = useSerumOrderbook(
    underlyingSerumMarketKey,
  )
  useSubscribeSerumOrderbook(underlyingSerumMarketKey)

  const markPrice = USE_BONFIDA_MARK_PRICE
    ? bonfidaMarkPrice
    : getPriceFromSerumOrderbook(underlyingOrderbook)

  const supportedStrikePrices = useMemo(() => {
    if (markPrice && showAllStrikes === false) {
      return getStrikePrices(markPrice).map((price) => price.toNumber())
    }
    return intervals.map((price) => price.toNumber())
  }, [markPrice, showAllStrikes])

  const fullPageLoading = assetListLoading || marketsLoading

  let precision
  if (round && chain[0]?.strike) {
    const n = chain[0].strike
    if (n >= 1) {
      precision = 2
    } else {
      const s = n.toString(10).replace('.', '')
      const numZeros = s.match(/^0+/)[0]?.length || 0
      precision = 3 + numZeros
    }
  }

  const filteredChain = useMemo(
    () =>
      chain.filter((row) => {
        return supportedStrikePrices.includes(row.strike.toNumber())
      }),
    [chain, supportedStrikePrices],
  )

  const rows = useMemo(
    () => [
      ...filteredChain,
      ...Array(Math.max(9 - filteredChain.length, 0))
        .fill(rowTemplate)
        .map((row, i) => ({
          ...row,
          key: `empty-${i}`,
        })),
    ],
    [filteredChain],
  )

  // Flat markets object for open orders component
  const marketsFlat = filteredChain
    .map((row) => [
      {
        ...row.call,
        type: 'call',
        strikePrice: round
          ? row.strike.toFixed(precision)
          : row.strike.toString(10),
      },
      {
        ...row.put,
        type: 'put',
        strikePrice: round
          ? row.strike.toFixed(precision)
          : row.strike.toString(10),
      },
    ])
    .reduce((a, b) => [...a, ...b], [])
    .filter((callOrPut) => !!callOrPut)

  useEffect(() => {
    buildOptionsChain(date.unix(), contractSize)
  }, [buildOptionsChain, contractSize, date])

  useEffect(() => {
    // Load serum markets when the options chain changes
    // Only if they don't already exist for the matching call/put
    chain.forEach(({ call, put }) => {
      if (call?.serumKey && !serumMarkets[call.serumKey]) {
        fetchSerumMarket(...call.serumKey.split('-'))
      }
      if (put?.serumKey && !serumMarkets[put.serumKey]) {
        fetchSerumMarket(...put.serumKey.split('-'))
      }
    })
  }, [chain, fetchSerumMarket, serumMarkets])

  // Open buy/sell/mint modal
  const handleBuySellClick = useCallback((callOrPut) => {
    setCallPutData(callOrPut)
    setBuySellDialogOpen(true)
  }, [])

  const updateContractSize = useCallback(
    (e) => setContractSize(e.target.value),
    [],
  )

  const buySellDialogHeading = callPutData
    ? `${callPutData.uAssetSymbol}-${
        callPutData.qAssetSymbol
      }${dblsp}|${dblsp}${date.format(
        'D MMM YYYY',
      )}${dblsp}|${dblsp}${callPutData.type.slice(0, 1).toUpperCase()}`
    : '--'

  return (
    <Page>
      <BuySellDialog
        {...callPutData}
        markPrice={markPrice}
        heading={buySellDialogHeading}
        open={buySellDialogOpen}
        onClose={() => setBuySellDialogOpen(false)}
        round={round}
        precision={precision}
        uAssetDecimals={uAsset?.decimals || 0}
        qAssetDecimals={qAsset?.decimals || 0}
        date={date}
      />
      <Box
        display="flex"
        justifyContent="center"
        flexDirection="column"
        minHeight="100%"
      >
        <Box
          py={[0, 0, 2]}
          display="flex"
          flexDirection={['column', 'column', 'row']}
          alignItems="center"
          justifyContent="space-between"
        >
          <Box
            width={['100%', '100%', 'auto']}
            display="flex"
            flexDirection={['column', 'column', 'row']}
            alignItems={['left', 'left', 'center']}
            justifyContent="space-between"
          >
            <Box px={0} py={0} width={['100%', '100%', '300px']}>
              <Select
                variant="filled"
                label="Expiration Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                options={expirations.map((d) => ({
                  value: d,
                  text: `${d.format('ll')} | 23:59:59 UTC`,
                }))}
                style={{
                  minWidth: '100%',
                }}
              />
            </Box>
            <Box px={[0, 0, 2]} py={0} width={['100%', '100%', '200px']}>
              <ContractSizeSelector
                onChange={updateContractSize}
                value={contractSize}
              />
            </Box>
          </Box>
          <Box px={[1, 1, 0]} py={[2, 2, 1]} width={['100%', '100%', 'auto']}>
            <Box pb={'6px'} pl="10px" fontSize={'14px'}>
              Asset Pair:
            </Box>
            <Box
              fontSize="12px"
              display="flex"
              alignItems="center"
              border={`1px solid ${theme.palette.background.lighter}`}
              borderRadius={'20px'}
              width={'fit-content'}
            >
              <Box pr={1}>
                <Box>
                  <SelectAsset
                    selectedAsset={uAsset}
                    onSelectAsset={(asset) => {
                      setUAsset(asset)
                    }}
                  />
                </Box>
              </Box>
              <h3 style={{ margin: 0 }}>/</h3>
              <Box pl={'4px'}>
                <SelectAsset disabled selectedAsset={qAsset} />
              </Box>
            </Box>
          </Box>
        </Box>
        <Box position="relative">
          <Box
            position="absolute"
            zIndex={5}
            right={['16px', '16px', '1px']}
            top={'8px'}
            bgcolor={theme.palette.background.default}
          >
            <RefreshButton
              loading={fullPageLoading}
              onRefresh={fetchMarketData}
            />
          </Box>
          <TableContainer>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  <TableCell colSpan={8}>
                    <h3 style={{ margin: 0 }}>
                      {`Calls${
                        uAsset && qAsset && !assetListLoading
                          ? `  (${uAsset.tokenSymbol}/${qAsset.tokenSymbol})`
                          : ''
                      }`}
                    </h3>
                  </TableCell>
                  <TableCell colSpan={1} />
                  <TableCell colSpan={8}>
                    <h3 style={{ margin: 0 }}>
                      {`Puts${
                        uAsset && qAsset && !assetListLoading
                          ? `  (${qAsset.tokenSymbol}/${uAsset.tokenSymbol})`
                          : ''
                      }`}
                    </h3>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <THeadCell align="left">Action</THeadCell>
                  {/* <THeadCell align="left">Size</THeadCell> */}
                  <THeadCell align="left" width={'70px'}>
                    IV
                  </THeadCell>
                  <THeadCell align="left" width={'90px'}>
                    Bid
                  </THeadCell>
                  <THeadCell align="left" width={'90px'}>
                    Ask
                  </THeadCell>
                  <THeadCell align="left" width={'70px'}>
                    IV
                  </THeadCell>
                  <THeadCell align="left">Change</THeadCell>
                  <THeadCell align="left">Volume</THeadCell>
                  <THeadCell align="left">Open</THeadCell>

                  <THeadCellStrike align="center">Strike</THeadCellStrike>

                  {/* <THeadCell align="right">Size</THeadCell> */}
                  <THeadCell align="right" width={'70px'}>
                    IV
                  </THeadCell>
                  <THeadCell align="right" width={'90px'}>
                    Bid
                  </THeadCell>
                  <THeadCell align="right" width={'90px'}>
                    Ask
                  </THeadCell>
                  <THeadCell align="right" width={'70px'}>
                    IV
                  </THeadCell>
                  <THeadCell align="right">Change</THeadCell>
                  <THeadCell align="right">Volume</THeadCell>
                  <THeadCell align="right">Open</THeadCell>
                  <THeadCell align="right">Action</THeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  return fullPageLoading ? (
                    <tr key={`${row.key}`}>
                      <TCellLoading
                        colSpan={8}
                        style={{
                          backgroundColor: theme.palette.background.medium,
                        }}
                      >
                        <Loading />
                      </TCellLoading>
                      <TCellStrike />
                      <TCellLoading
                        colSpan={8}
                        style={{
                          backgroundColor: theme.palette.background.medium,
                        }}
                      >
                        <Loading />
                      </TCellLoading>
                    </tr>
                  ) : (
                    <CallPutRow
                      key={`${row.key}`}
                      row={row}
                      uAsset={uAsset}
                      qAsset={qAsset}
                      date={date}
                      precision={precision}
                      round={round}
                      onClickBuySellCall={handleBuySellClick}
                      onClickBuySellPut={handleBuySellClick}
                      markPrice={markPrice}
                    />
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box
            py={1}
            px={[1, 1, 0]}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              {!!uAsset?.tokenSymbol && !!markPrice && (
                <>
                  {uAsset?.tokenSymbol} Market Price: $
                  {markPrice && markPrice.toFixed(precision)}
                </>
              )}
            </Box>
            <FormControlLabel
              labelPlacement="start"
              control={
                <Switch
                  checked={round}
                  onChange={() => setRound(!round)}
                  name="round-strike-prices"
                  color="primary"
                  size="small"
                />
              }
              label={
                <span style={{ fontSize: '14px' }}>Round Strike Prices</span>
              }
              style={{ margin: '0' }}
            />
          </Box>
          <Box>
            <OpenOrders optionMarkets={marketsFlat} />
          </Box>
        </Box>
      </Box>
    </Page>
  )
}

export default Markets
