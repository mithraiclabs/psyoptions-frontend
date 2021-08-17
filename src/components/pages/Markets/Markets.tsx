/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Box from '@material-ui/core/Box'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Switch from '@material-ui/core/Switch'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableContainer from '@material-ui/core/TableContainer'
import TableRow from '@material-ui/core/TableRow'
import ChevronLeft from '@material-ui/icons/ChevronLeft'
import ChevronRight from '@material-ui/icons/ChevronRight'
import { PublicKey } from '@solana/web3.js'
import moment from 'moment'
import BigNumber from 'bignumber.js'

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

import { MarketDataProvider } from '../../../context/MarketDataContext'

import Page from '../Page'
import Select from '../../Select'
import SelectAsset from '../../SelectAsset'
import CallPutRow from './CallPutRow'
import BuySellDialog from '../../BuySellDialog'
import Loading from '../../Loading'
import OpenOrders from '../../OpenOrders'
import UnsettledBalancesTable from '../../UnsettledBalancesTable'
import { ContractSizeSelector } from '../../ContractSizeSelector'

import { TCellLoading, THeadCell, TCellStrike, PageButton } from './styles'
import Balances from './MarketsBalances'
import MarketsUnsettledBalances from './MarketsUnsettledBalances'
import { MarketsTableHeader } from './MarketsTableHeader'
import { CallOrPut, OptionType } from '../../../types'
import { useBatchLoadMints } from '../../../hooks/SPLToken'

const dblsp = `${'\u00A0'}${'\u00A0'}`

const defaultSizeOptions = [
  {
    value: 100,
    text: '100',
  },
  {
    value: 10,
    text: '10',
  },
  {
    value: 1,
    text: '1',
  },
  {
    value: 0.1,
    text: '0.1',
  },
]

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
  BTC: 0.1,
  other: 100,
}

const Markets = () => {
  const { uAsset, qAsset, setUAsset, assetListLoading } = useAssetList()
  const { selectedDate: date, setSelectedDate, dates } = useExpirationDate()
  const [contractSize, setContractSize] = useState(100)
  const { chains, buildOptionsChain } = useOptionsChain()
  const { getSizes, marketsLoading } = useOptionsMarkets()
  const { serumMarkets, fetchMultipleSerumMarkets } = useSerum()
  const [round, setRound] = useState(true)
  const [buySellDialogOpen, setBuySellDialogOpen] = useState(false)
  const [callPutData, setCallPutData] = useState({ type: 'call' } as CallOrPut)
  const [showAllStrikes] = useState(true) // TODO: let user configure this
  const [page, setPage] = useState(0)
  const [initialMarkPrice, setInitialMarkPrice] = useState(null)
  const [sizeOptions, setSizeOptions] = useState(defaultSizeOptions)
  const [limitPrice, setLimitPrice] = useState('0')
  const rowsPerPage = 7
  const [showIV, setShowIV] = useState(true)
  const [showPriceChange, setShowPriceChange] = useState(true)
  const [showLastPrice, setShowLastPrice] = useState(true)
  const [showVolume, setShowVolume] = useState(true)
  const [showOI, setShowOI] = useState(true)
  const [currentColumnsCount, setColumnsCount] = useState(19) // 19 columns

  useEffect(() => {
    const availableSizes = getSizes({
      uAssetSymbol: uAsset?.tokenSymbol,
      qAssetSymbol: qAsset?.tokenSymbol,
    })
    setSizeOptions(
      availableSizes.map((s) => ({ text: s.toString(), value: parseFloat(s) })),
    )
  }, [getSizes, uAsset?.tokenSymbol, qAsset?.tokenSymbol])

  // Unfortunately we need to set contract size in a useEffect because uAsset is asynchronously loaded
  useEffect(() => {
    if (sizeOptions.find((s) => s.value === uAsset?.defaultContractSize)) {
      setContractSize(uAsset.defaultContractSize)
    } else {
      if (sizeOptions[0]) {
        setContractSize(sizeOptions[0].value)
      }
    }
  }, [uAsset?.defaultContractSize, sizeOptions])

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

  // We have to use this `initialMarkPrice` to filter the chains, otherwise many components will
  // re-render every time a new price is received from a websocket. This triggers unnecessary batch
  // requests to the chain.
  useEffect(() => {
    if (!initialMarkPrice) {
      setInitialMarkPrice(markPrice)
    }
  }, [initialMarkPrice, markPrice, setInitialMarkPrice])

  const supportedStrikePrices = useMemo(() => {
    if (initialMarkPrice && showAllStrikes === false) {
      return getStrikePrices(initialMarkPrice).map((price) => price.toNumber())
    }
    return intervals.map((price) => price.toNumber())
  }, [initialMarkPrice, showAllStrikes])

  const fullPageLoading = assetListLoading || marketsLoading

  let precision
  if (round && chains[0]?.strike) {
    const n = chains[0].strike
    if (n >= new BigNumber(1)) {
      precision = 2
    } else {
      const s = n.toString(10).replace('.', '')
      const numZeros = s.match(/^0+/)[0]?.length || 0
      precision = 3 + numZeros
    }
  }

  const filteredChain = useMemo(
    () =>
      chains.filter((row) => {
        return supportedStrikePrices.includes(row.strike.toNumber())
      }),
    [chains, supportedStrikePrices],
  )

  const numberOfPages = Math.ceil(filteredChain.length / rowsPerPage)

  const rowsToDisplay = useMemo(() => {
    return filteredChain.slice(rowsPerPage * page, rowsPerPage * (page + 1))
  }, [filteredChain, page])

  // handle pagination and add
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

  // batch request the option mint information for each row
  const optionMints = useMemo(() => {
    const tmp: PublicKey[] = []
    rows.forEach((row) => {
      if (row?.call?.optionMintKey) {
        tmp.push(row?.call?.optionMintKey)
      }
      if (row?.put?.optionMintKey) {
        tmp.push(row?.put?.optionMintKey)
      }
    })
    return tmp
  }, [rows])
  useBatchLoadMints(optionMints)

  // Flat markets object for open orders component
  const marketsFlat = filteredChain
    .map((row) => [
      {
        ...row.call,
        type: OptionType.CALL,
        strikePrice: round
          ? row.strike.toFixed(precision)
          : row.strike.toString(10),
      },
      {
        ...row.put,
        type: OptionType.PUT,
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
    const serumKeys: PublicKey[] = []
    rowsToDisplay.forEach(({ call, put }) => {
      if (
        call?.serumMarketKey &&
        !serumMarkets[call.serumMarketKey.toString()]
      ) {
        serumKeys.push(call.serumMarketKey)
      }
      if (put?.serumMarketKey && !serumMarkets[put.serumMarketKey.toString()]) {
        serumKeys.push(put.serumMarketKey)
      }
    })
    if (serumKeys.length) {
      fetchMultipleSerumMarkets(serumKeys)
    }
  }, [chains, rowsToDisplay, fetchMultipleSerumMarkets, serumMarkets])

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
    <MarketDataProvider chain={chains}>
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
          setLimitPrice={setLimitPrice}
          limitPrice={limitPrice}
          serumAddress={callPutData.serumMarketKey?.toString()}
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
              <Box p={[2, 2, 0]} width={['100%', '100%', '300px']}>
                <Select
                  formControlOptions={{
                    variant: 'filled',
                    style: {
                      minWidth: '100%',
                    },
                  }}
                  label="Expiration Date"
                  value={date.toISOString()}
                  onChange={(e) => setSelectedDate(moment.utc(e.target.value))}
                  options={dates.map((d) => ({
                    value: d.toISOString(),
                    text: `${d.format('ll')} | 23:59:59 UTC`,
                  }))}
                />
              </Box>
              <Box
                pt={[0, 0, 2]}
                pb={[2, 2, 2]}
                px={2}
                width={['100%', '100%', '200px']}
              >
                <ContractSizeSelector
                  onChange={updateContractSize}
                  value={contractSize}
                  options={sizeOptions}
                />
              </Box>
              <Box px={[0, 0, 2]} py={[2, 2, 0]}>
                <Balances />
              </Box>
              <Box py={[2, 2, 0]}>
                <MarketsUnsettledBalances />
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
                      disabled={false}
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
                <MarketsTableHeader
                  uAssetSymbol={uAsset?.tokenSymbol || ''}
                  qAssetSymbol={qAsset?.tokenSymbol}
                  showIV={showIV}
                  showPriceChange={showPriceChange}
                  showVolume={showVolume}
                  showOI={showOI}
                  showLastPrice={showLastPrice}
                  setShowIV={setShowIV}
                  setShowPriceChange={setShowPriceChange}
                  setShowLastPrice={setShowLastPrice}
                  setShowVolume={setShowVolume}
                  setShowOI={setShowOI}
                  currentColumnsCount={currentColumnsCount}
                  setColumnsCount={setColumnsCount}
                />
                <TableBody>
                  {rows.map((row) => {
                    return fullPageLoading ? (
                      <tr key={`${row.key}`}>
                        <TCellLoading
                          colSpan={9}
                          style={{
                            backgroundColor: theme.palette.background.medium,
                          }}
                        >
                          <Loading />
                        </TCellLoading>
                        <TCellStrike />
                        <TCellLoading
                          colSpan={9}
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
                        setLimitPrice={setLimitPrice}
                        showIV={showIV}
                        showPriceChange={showPriceChange}
                        showVolume={showVolume}
                        showLastPrice={showLastPrice}
                        showOI={showOI}
                      />
                    )
                  })}
                  <TableRow>
                    <THeadCell
                      colSpan={currentColumnsCount}
                      style={{ borderBottom: 'none' }}
                    >
                      <Box
                        py={1}
                        px={[1, 1, 0]}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        {/* @ts-ignore: annoying MUI stuff */}
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
                          /* @ts-ignore: annoying MUI stuff */
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
                        {/* @ts-ignore: annoying MUI stuff */}
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
            <Box id='unsettled-balances-table'>
              <UnsettledBalancesTable
                uAssetDecimals={uAsset?.decimals}
                qAssetDecimals={qAsset?.decimals}
                optionMarkets={marketsFlat}
              />
            </Box>
          </Box>
        </Box>
      </Page>
    </MarketDataProvider>
  )
}

export default Markets
