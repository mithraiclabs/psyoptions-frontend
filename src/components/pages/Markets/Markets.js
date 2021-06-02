import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Box from '@material-ui/core/Box'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Switch from '@material-ui/core/Switch'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import ChevronLeft from '@material-ui/icons/ChevronLeft'
import ChevronRight from '@material-ui/icons/ChevronRight'
import moment from 'moment'

import theme from '../../../utils/theme'
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
import useExpirationDate from '../../../hooks/useExpirationDate'

import Page from '../Page'
import Select from '../../Select'
import SelectAsset from '../../SelectAsset'
import CallPutRow from './CallPutRow'
import BuySellDialog from '../../BuySellDialog'
import Loading from '../../Loading'
import OpenOrders from '../../OpenOrders'
import { ContractSizeSelector } from '../../ContractSizeSelector'

import { TCellLoading, THeadCell, TCellStrike, PageButton } from './styles'

const dblsp = `${'\u00A0'}${'\u00A0'}`

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

const USE_BONFIDA_MARK_PRICE = true

const defaultContractSizes = {
  BTC: 1,
  other: 100,
}

const Markets = () => {
  const { uAsset, qAsset, setUAsset, assetListLoading } = useAssetList()
  const { selectedDate: date, setSelectedDate, dates } = useExpirationDate()
  const [contractSize, setContractSize] = useState(100)
  const { chain, buildOptionsChain } = useOptionsChain()
  const { marketsLoading } = useOptionsMarkets()
  const { serumMarkets, fetchSerumMarket } = useSerum()
  const [round, setRound] = useState(true)
  const [buySellDialogOpen, setBuySellDialogOpen] = useState(false)
  const [callPutData, setCallPutData] = useState({ type: 'call' })
  const [showAllStrikes] = useState(true) // TODO: let user configure this
  const [page, setPage] = useState(0)
  const rowsPerPage = 7

  // Unfortunately we need to set contract size in a useEffect because uAsset is asynchronously loaded
  useEffect(() => {
    setContractSize(
      defaultContractSizes[uAsset?.tokenSymbol] || defaultContractSizes.other,
    )
  }, [uAsset])

  // mainnet mark price from bonfida
  const bonfidaMarkPrice = useBonfidaMarkPrice({
    uAssetSymbol: uAsset?.tokenSymbol,
    qAssetSymbol: qAsset?.tokenSymbol,
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

  const numberOfPages = Math.ceil(filteredChain.length / rowsPerPage)

  const rowsToDisplay = useMemo(() => {
    return filteredChain.slice(rowsPerPage * page, rowsPerPage * (page + 1))
  }, [filteredChain, page])

  const rows = useMemo(
    () => [
      ...rowsToDisplay,
      ...Array(Math.max(rowsPerPage - rowsToDisplay.length, 0))
        .fill(rowTemplate)
        .map((row, i) => ({
          ...row,
          key: `empty-${i}`,
        })),
    ],
    [rowsToDisplay],
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
    rowsToDisplay.forEach(({ call, put }) => {
      if (call?.serumKey && !serumMarkets[call.serumKey]) {
        fetchSerumMarket(...call.serumKey.split('-'))
      }
      if (put?.serumKey && !serumMarkets[put.serumKey]) {
        fetchSerumMarket(...put.serumKey.split('-'))
      }
    })
  }, [rowsToDisplay, fetchSerumMarket, serumMarkets])

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

  const currentPageStart = page * rowsPerPage + 1
  const currentPageEnd = Math.min(
    rowsPerPage * (page + 1),
    filteredChain.length,
  )
  const currentPageLabel =
    currentPageStart !== currentPageEnd
      ? `${currentPageStart}-${currentPageEnd} of ${filteredChain.length}`
      : `${currentPageStart} of ${filteredChain.length}`

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
        date={date}
        uAssetDecimals={
          callPutData?.type === 'call' ? uAsset?.decimals : qAsset?.decimals
        }
        qAssetDecimals={
          callPutData?.type === 'call' ? qAsset?.decimals : uAsset?.decimals
        }
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
                value={date.toISOString()}
                onChange={(e) => setSelectedDate(moment.utc(e.target.value))}
                options={dates.map((d) => ({
                  value: d.toISOString(),
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
          <TableContainer>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  <THeadCell
                    colSpan={8}
                    style={{ borderTop: 'none', padding: '16px 20px' }}
                  >
                    <h3 style={{ margin: 0 }}>
                      {`Calls${
                        uAsset && qAsset && !assetListLoading
                          ? `  (${uAsset.tokenSymbol}/${qAsset.tokenSymbol})`
                          : ''
                      }`}
                    </h3>
                  </THeadCell>
                  <TCellStrike colSpan={1} />
                  <THeadCell
                    colSpan={8}
                    style={{ borderTop: 'none', padding: '16px 20px' }}
                  >
                    <h3 style={{ margin: 0 }}>
                      {`Puts${
                        uAsset && qAsset && !assetListLoading
                          ? `  (${qAsset.tokenSymbol}/${uAsset.tokenSymbol})`
                          : ''
                      }`}
                    </h3>
                  </THeadCell>
                </TableRow>
                <TableRow>
                  <THeadCell align="left" style={{ paddingLeft: '16px' }}>
                    Action
                  </THeadCell>
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

                  <TCellStrike align="center">Strike</TCellStrike>

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
                  <THeadCell align="right" style={{ paddingRight: '16px' }}>
                    Action
                  </THeadCell>
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
                <TableRow>
                  <THeadCell colSpan={17} style={{ borderBottom: 'none' }}>
                    <Box
                      py={1}
                      px={[1, 1, 0]}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box width="33%" align="left">
                        {!!uAsset?.tokenSymbol && !!markPrice && (
                          <>
                            {uAsset?.tokenSymbol} Market Price: $
                            {markPrice && markPrice.toFixed(precision)}
                          </>
                        )}
                      </Box>
                      <Box
                        width="33%"
                        align="center"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                      >
                        {numberOfPages > 1 && (
                          <>
                            <PageButton
                              disabled={page === 0}
                              onClick={() => setPage(Math.max(page - 1, 0))}
                            >
                              <ChevronLeft />
                            </PageButton>
                            <Box width="80px">{currentPageLabel}</Box>
                            <PageButton
                              disabled={page === numberOfPages - 1}
                              onClick={() =>
                                setPage(Math.min(page + 1, numberOfPages))
                              }
                            >
                              <ChevronRight />
                            </PageButton>
                          </>
                        )}
                      </Box>
                      <Box width="33%" align="right">
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
                            <span style={{ fontSize: '14px' }}>
                              Round Strike Prices
                            </span>
                          }
                          style={{ margin: '0' }}
                        />
                      </Box>
                    </Box>
                  </THeadCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Box>
            <OpenOrders optionMarkets={marketsFlat} />
          </Box>
        </Box>
      </Box>
    </Page>
  )
}

export default Markets
