/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableContainer,
  TableRow,
} from '@material-ui/core';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import moment from 'moment';
import { TCellLoading, THeadCell, TCellStrike, PageButton } from './styles';
import Balances from './MarketsBalances';
import MarketsUnsettledBalances from './MarketsUnsettledBalances';
import { MarketsTableHeader } from './MarketsTableHeader';
import useAssetList from '../../hooks/useAssetList';
import useOptionsMarkets from '../../hooks/useOptionsMarkets';
import useSerum from '../../hooks/useSerum';
import { MarketDataProvider } from '../../context/MarketDataContext';
import Page from '../pages/Page';
import BuySellDialog from '../BuySellDialog';
import { ContractSizeSelector } from '../ContractSizeSelector';
import theme from '../../utils/theme';
import Loading from '../Loading';
import CallPutRow from './CallPutRow';
import OpenOrders from '../OpenOrders';
import UnsettledBalancesTable from '../UnsettledBalancesTable';
import { calculateStrikePrecision } from '../../utils/getStrikePrices';
import { useSerumPriceByAssets } from '../../hooks/Serum/useSerumPriceByAssets';
import { CallOrPut, SerumMarketAndProgramId } from '../../types';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  quoteMint,
  selectExpirationAsDate,
  selectMintsOfFutureOptions,
  selectUnderlyingMintWithSideEffects,
  underlyingAmountPerContract,
  useUpdateLastOptionParamsByAssetPair,
} from '../../recoil';
import { SelectAsset } from '../SelectAsset';
import { useOptionsChainFromMarketsState } from '../../hooks/useOptionChainsFromMarketsState';
import { SelectExpiration } from './SelectExpiration';
import { useTokenByMint } from '../../hooks/useNetworkTokens';

const rowTemplate = {
  call: {
    key: '',
    change: '',
    volume: '',
    openInterest: '',
    size: '',
    emptyRow: true,
    actionInProgress: false,
  },
  put: {
    key: '',
    change: '',
    volume: '',
    openInterest: '',
    size: '',
    emptyRow: true,
    actionInProgress: false,
  },
};

// TODO move Serum market storage to Recoil
const Markets: React.VFC = () => {
  useUpdateLastOptionParamsByAssetPair();
  const { assetListLoading } = useAssetList();
  const chains = useOptionsChainFromMarketsState();
  const { marketsLoading } = useOptionsMarkets();
  const [_underlyingMint, setUnderlyingMint] = useRecoilState(
    selectUnderlyingMintWithSideEffects,
  );
  const [_quoteMint, setQuoteMint] = useRecoilState(quoteMint);
  const mints = useRecoilValue(selectMintsOfFutureOptions);
  const expirationDateString = useRecoilValue(selectExpirationAsDate);
  const contractSize = useRecoilValue(underlyingAmountPerContract);
  const underlyingAsset = useTokenByMint(_underlyingMint ?? '');
  const { serumMarkets, fetchMultipleSerumMarkets } = useSerum();
  const [round, setRound] = useState(true);
  const [buySellDialogOpen, setBuySellDialogOpen] = useState(false);
  const [callPutData, setCallPutData] = useState({ type: 'call' } as CallOrPut);
  const [page, setPage] = useState(0);
  const [initialMarkPrice, setInitialMarkPrice] = useState<number | null>(null);
  const [limitPrice, setLimitPrice] = useState('0');
  const rowsPerPage = 7;
  const [showIV, setShowIV] = useState(true);
  const [showPriceChange, setShowPriceChange] = useState(true);
  const [showLastPrice, setShowLastPrice] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showOI, setShowOI] = useState(true);
  const [currentColumnsCount, setColumnsCount] = useState(19); // 19 columns
  const momentDate = useMemo(
    () => moment(expirationDateString),
    [expirationDateString],
  );
  const underlyingAssetSymbol =
    underlyingAsset?.symbol ?? _underlyingMint?.toString() ?? '';

  const markPrice = useSerumPriceByAssets(
    _underlyingMint?.toString() ?? null,
    _quoteMint?.toString() ?? null,
  );

  // We have to use this `initialMarkPrice` to filter the chains, otherwise many components will
  // re-render every time a new price is received from a websocket. This triggers unnecessary batch
  // requests to the chain.
  useEffect(() => {
    if (!initialMarkPrice) {
      setInitialMarkPrice(markPrice);
    }
  }, [initialMarkPrice, markPrice, setInitialMarkPrice]);

  const fullPageLoading = assetListLoading || marketsLoading;

  let precision = 0;
  if (round && chains[0]?.strike) {
    precision = calculateStrikePrecision(chains[0].strike);
  }

  const filteredChain = chains;

  const numberOfPages = Math.ceil(filteredChain.length / rowsPerPage);

  const rowsToDisplay = useMemo(() => {
    return filteredChain.slice(rowsPerPage * page, rowsPerPage * (page + 1));
  }, [filteredChain, page]);

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
  );

  useEffect(() => {
    // Load serum markets when the options chain changes
    // Only if they don't already exist for the matching call/put
    const serumKeys: SerumMarketAndProgramId[] = [];
    rowsToDisplay.forEach(({ call, put }) => {
      if (
        call?.serumMarketKey &&
        !serumMarkets[call.serumMarketKey.toString()]
      ) {
        serumKeys.push({
          serumMarketKey: call.serumMarketKey,
          serumProgramId: call.serumProgramId,
        });
      }
      if (put?.serumMarketKey && !serumMarkets[put.serumMarketKey.toString()]) {
        serumKeys.push({
          serumMarketKey: put.serumMarketKey,
          serumProgramId: put.serumProgramId,
        });
      }
    });
    if (serumKeys.length) {
      fetchMultipleSerumMarkets(serumKeys);
    }
  }, [chains, rowsToDisplay, fetchMultipleSerumMarkets, serumMarkets]);

  // Open buy/sell/mint modal
  const handleBuySellClick = useCallback((callOrPut: CallOrPut) => {
    setCallPutData(callOrPut);
    setBuySellDialogOpen(true);
  }, []);

  const currentPageStart = page * rowsPerPage + 1;
  const currentPageEnd = Math.min(
    rowsPerPage * (page + 1),
    filteredChain.length,
  );
  const currentPageLabel =
    currentPageStart !== currentPageEnd
      ? `${currentPageStart}-${currentPageEnd} of ${filteredChain.length}`
      : `${currentPageStart} of ${filteredChain.length}`;

  return (
    <MarketDataProvider chain={chains}>
      <Page>
        {momentDate && !!callPutData.key && (
          <BuySellDialog
            {...callPutData}
            optionKey={callPutData.key}
            markPrice={markPrice}
            open={buySellDialogOpen}
            onClose={() => setBuySellDialogOpen(false)}
            round={round}
            precision={precision}
            date={momentDate}
            setLimitPrice={setLimitPrice}
            limitPrice={limitPrice}
            serumAddress={callPutData.serumMarketKey?.toString() ?? ''}
          />
        )}
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
                <SelectExpiration />
              </Box>
              <Box
                pt={[0, 0, 2]}
                pb={[2, 2, 2]}
                px={2}
                width={['100%', '100%', '200px']}
              >
                <ContractSizeSelector />
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
                      onChange={setUnderlyingMint}
                      mints={mints}
                      value={_underlyingMint}
                    />
                  </Box>
                </Box>
                <h3 style={{ margin: 0 }}>/</h3>
                <Box pl={'4px'}>
                  <SelectAsset
                    onChange={setQuoteMint}
                    mints={mints}
                    value={_quoteMint}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
          <Box position="relative">
            <TableContainer>
              <Table stickyHeader aria-label="sticky table">
                <MarketsTableHeader
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
                  {momentDate &&
                    rows.map((row) => {
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
                          date={momentDate}
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
                          contractSize={contractSize?.toNumber()}
                        />
                      );
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
                          {!!underlyingAssetSymbol && !!markPrice && (
                            <>
                              {underlyingAssetSymbol} Market Price: $
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
            <Box id="unsettled-balances-table" mt={'20px'}>
              <UnsettledBalancesTable />
            </Box>
            <Box mt={'20px'}>
              <OpenOrders />
            </Box>
          </Box>
        </Box>
      </Page>
    </MarketDataProvider>
  );
};

export default Markets;
