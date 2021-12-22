import React, { useEffect, useMemo } from 'react';

import { styled } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import moment, { Moment } from 'moment';
import BigNumber from 'bignumber.js';

import theme from '../../utils/theme';
import useSerum from '../../hooks/useSerum';
import { useImpliedVol } from '../../hooks/useImpliedVol';

import Loading from '../Loading';
import { useSubscribeSerumOrderbook } from '../../hooks/Serum';
import { useSubscribeSPLTokenMint } from '../../hooks/SPLToken';
import { useSerumOrderbooks } from '../../context/SerumOrderbookContext';
import { TCell, TCellLoading, TCellStrike, TRow } from './styles';
import { useMarketData } from '../../context/MarketDataContext';
import { CallOrPut, OptionType } from '../../types';
import { useSPLTokenMints } from '../../context/SPLTokenMintsContext';
import { optionsMap } from '../../recoil';
import { useRecoilValue } from 'recoil';

const Empty: React.FC = ({ children }) => (
  <span style={{ opacity: '0.3' }}>{children}</span>
);

const Bid: React.FC = ({ children }) => (
  <span style={{ color: theme.palette.success.main }}>{children}</span>
);

const Ask: React.FC = ({ children }) => (
  <span style={{ color: theme.palette.error.light }}>{children}</span>
);

const ChangeCell = styled(TCell)(({ change }: { change: number }) => {
  if (change > 0) {
    return { color: theme.palette.success.main };
  }
  if (change < 0) {
    return { color: theme.palette.error.light };
  }
  return {};
});

type CallPutRowProps = {
  row: {
    strike: BigNumber;
    call: CallOrPut;
    put: CallOrPut;
  };
  date: Moment;
  // Precision for strike price rounding with .toFixed
  precision: number;
  round: boolean;
  // Current market price of the underlying asset on serum
  markPrice: number;
  onClickBuySellCall: (callOrPut: CallOrPut) => void;
  onClickBuySellPut: (callOrPut: CallOrPut) => void;
  setLimitPrice: (str: string) => void;
  showIV: boolean;
  showPriceChange: boolean;
  showVolume: boolean;
  showOI: boolean;
  showLastPrice: boolean;
  contractSize: number;
};

const CallPutRow: React.VFC<CallPutRowProps> = ({
  row,
  round = false,
  precision = 2,
  date,
  markPrice,
  onClickBuySellCall,
  onClickBuySellPut,
  setLimitPrice,
  showIV,
  showPriceChange,
  showVolume,
  showOI,
  showLastPrice,
  contractSize,
}) => {
  const { serumMarkets } = useSerum();
  const [orderbooks] = useSerumOrderbooks();
  const [splTokenMints] = useSPLTokenMints();
  const callOption = useRecoilValue(optionsMap(row.call?.key?.toString()));
  const putOption = useRecoilValue(optionsMap(row.put?.key?.toString()));
  const marketTrackerData = useMarketData();
  const timeToExpiry = useMemo(
    () => Math.max(date.diff(moment.utc(), 'years', true), 0),
    [date],
  );
  useSubscribeSPLTokenMint(callOption?.optionMint);
  useSubscribeSPLTokenMint(putOption?.optionMint);
  useSubscribeSerumOrderbook(row?.call?.serumMarketKey?.toString() ?? '');
  useSubscribeSerumOrderbook(row?.put?.serumMarketKey?.toString() ?? '');
  const callOrderbook = orderbooks[row.call?.serumMarketKey?.toString() ?? ''];
  const putOrderbook = orderbooks[row.put?.serumMarketKey?.toString() ?? ''];

  const callHighestBid = callOrderbook?.bids?.[0]?.price;
  const callLowestAsk = callOrderbook?.asks?.[0]?.price;
  const putHighestBid = putOrderbook?.bids?.[0]?.price;
  const putLowestAsk = putOrderbook?.asks?.[0]?.price;
  const callOptionMintInfo =
    splTokenMints[callOption?.optionMint?.toString() ?? ''];
  const putOptionMintInfo =
    splTokenMints[putOption?.optionMint?.toString() ?? ''];

  const strikeAsNumber = row.strike?.toNumber();

  const callBidIV = useImpliedVol({
    optionPrice: (callHighestBid || 0) / contractSize,
    strikePrice: strikeAsNumber,
    marketPrice: markPrice,
    timeToExpiry,
    type: OptionType.CALL,
  });

  const callAskIV = useImpliedVol({
    optionPrice: (callLowestAsk || 0) / contractSize,
    strikePrice: strikeAsNumber,
    marketPrice: markPrice,
    timeToExpiry,
    type: OptionType.CALL,
  });

  const putBidIV = useImpliedVol({
    optionPrice: putHighestBid / contractSize,
    strikePrice: strikeAsNumber,
    marketPrice: markPrice,
    timeToExpiry,
    type: OptionType.PUT,
  });

  const putAskIV = useImpliedVol({
    optionPrice: putLowestAsk / contractSize,
    strikePrice: strikeAsNumber,
    marketPrice: markPrice,
    timeToExpiry,
    type: OptionType.PUT,
  });

  const formatStrike = (sp: BigNumber | undefined) => {
    if (!sp) return <Empty>{'—'}</Empty>;
    return <span>{round ? sp.toFixed(precision) : sp.toString(10)}</span>;
  };

  const callCellStyle = row.strike?.lte(markPrice)
    ? { backgroundColor: theme.palette.background.tableHighlight }
    : { backgroundColor: theme.palette.background.marketsCallPutRow };
  const putCellStyle = row.strike?.gte(markPrice)
    ? { backgroundColor: theme.palette.background.tableHighlight }
    : { backgroundColor: theme.palette.background.marketsCallPutRow };

  const openBuySellModal = (callOrPut: 'call' | 'put', price = '0') => {
    // only allow full row clicking open for initialized markets
    if (callOrPut === 'call' && row.call?.initialized) {
      onClickBuySellCall({
        ...row.call,
        type: OptionType.CALL,
        strike: row.strike,
      });
      setLimitPrice(price);
    }
    if (callOrPut === 'put' && row.put?.initialized) {
      onClickBuySellPut({
        ...row.put,
        type: OptionType.PUT,
        strike: row.strike,
      });
      setLimitPrice(price);
    }
  };

  const putChange =
    marketTrackerData?.[row.put?.serumMarketKey?.toString() ?? '']?.change24h ??
    0;
  const callChange =
    marketTrackerData?.[row.call?.serumMarketKey?.toString() ?? '']
      ?.change24h ?? 0;

  useEffect(() => {
    // TODO: Request the data from Aleph
  });

  return (
    <TRow hover role="checkbox" tabIndex={-1}>
      <TCell align="left" style={callCellStyle} width={'120px'}>
        {row.call?.initialized ? (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => openBuySellModal('call')}
          >
            Buy/Sell
          </Button>
        ) : null}
      </TCell>
      {row.call?.serumMarketKey &&
      serumMarkets[row.call.serumMarketKey?.toString()]?.loading ? (
        <TCellLoading colSpan={8} style={callCellStyle}>
          <Loading />
        </TCellLoading>
      ) : (
        <>
          {showIV && (
            <TCell
              align="left"
              style={callCellStyle}
              width={'70px'}
              onClick={() => openBuySellModal('call')}
            >
              {(callBidIV && `${callBidIV.toFixed(1)}%`) || (
                <Empty>{'—'}</Empty>
              )}
            </TCell>
          )}
          <TCell
            align="left"
            style={callCellStyle}
            width={'90px'}
            onClick={() => openBuySellModal('call', callHighestBid?.toFixed(2))}
          >
            {callHighestBid ? (
              <Bid>${callHighestBid.toFixed(2)}</Bid>
            ) : (
              <Empty>{'—'}</Empty>
            )}
          </TCell>
          <TCell
            align="left"
            style={callCellStyle}
            width={'90px'}
            onClick={() => openBuySellModal('call', callLowestAsk?.toFixed(2))}
          >
            {callLowestAsk ? (
              <Ask>${callLowestAsk.toFixed(2)}</Ask>
            ) : (
              <Empty>{'—'}</Empty>
            )}
          </TCell>
          {showIV && (
            <TCell
              align="left"
              style={callCellStyle}
              width={'70px'}
              onClick={() => openBuySellModal('call')}
            >
              {(callAskIV && `${callAskIV.toFixed(1)}%`) || (
                <Empty>{'—'}</Empty>
              )}
            </TCell>
          )}
          {showLastPrice && (
            <TCell
              align="left"
              style={callCellStyle}
              onClick={() => openBuySellModal('call')}
            >
              {marketTrackerData?.[row.call?.serumMarketKey?.toString() ?? '']
                ?.price ? (
                `$${
                  marketTrackerData?.[
                    row.call?.serumMarketKey?.toString() ?? ''
                  ]?.price
                }`
              ) : (
                <Empty>{'—'}</Empty>
              )}
            </TCell>
          )}
          {showPriceChange && (
            <ChangeCell
              change={callChange}
              align="left"
              style={callCellStyle}
              onClick={() => openBuySellModal('call')}
            >
              {callChange ? `${callChange.toFixed(1)}%` : <Empty>{'—'}</Empty>}
            </ChangeCell>
          )}
          {showVolume && (
            <TCell
              align="left"
              style={callCellStyle}
              onClick={() => openBuySellModal('call')}
            >
              {marketTrackerData?.[row.call?.serumMarketKey?.toString() ?? '']
                ?.volBase24h || <Empty>{'—'}</Empty>}
            </TCell>
          )}
          {showOI && (
            <TCell
              align="left"
              style={callCellStyle}
              onClick={() => openBuySellModal('call')}
            >
              {callOptionMintInfo?.supply.toString() || <Empty>{'—'}</Empty>}
            </TCell>
          )}
        </>
      )}

      <TCellStrike align="center">
        <Box fontSize={'15px'}>{formatStrike(row.strike)}</Box>
      </TCellStrike>

      {row.put?.serumMarketKey &&
      serumMarkets[row.put.serumMarketKey.toString()]?.loading ? (
        <TCellLoading colSpan={8} style={putCellStyle}>
          <Loading />
        </TCellLoading>
      ) : (
        <>
          {showIV && (
            <TCell
              align="right"
              style={putCellStyle}
              width={'70px'}
              onClick={() => openBuySellModal('put')}
            >
              {(putBidIV && `${putBidIV.toFixed(1)}%`) || <Empty>{'—'}</Empty>}
            </TCell>
          )}
          <TCell
            align="right"
            style={putCellStyle}
            width={'90px'}
            onClick={() => openBuySellModal('put', putHighestBid?.toFixed(2))}
          >
            {putHighestBid ? (
              <Bid>${putHighestBid.toFixed(2)}</Bid>
            ) : (
              <Empty>{'—'}</Empty>
            )}
          </TCell>
          <TCell
            align="right"
            style={putCellStyle}
            width={'90px'}
            onClick={() => openBuySellModal('put', putLowestAsk?.toFixed(2))}
          >
            {putLowestAsk ? (
              <Ask>${putLowestAsk.toFixed(2)}</Ask>
            ) : (
              <Empty>{'—'}</Empty>
            )}
          </TCell>
          {showIV && (
            <TCell
              align="right"
              style={putCellStyle}
              width={'70px'}
              onClick={() => openBuySellModal('put')}
            >
              {(putAskIV && `${putAskIV.toFixed(1)}%`) || <Empty>{'—'}</Empty>}
            </TCell>
          )}
          {showLastPrice && (
            <TCell
              align="right"
              style={putCellStyle}
              onClick={() => openBuySellModal('call')}
            >
              {marketTrackerData?.[row.put?.serumMarketKey?.toString() ?? '']
                ?.price ? (
                `$${
                  marketTrackerData?.[row.put?.serumMarketKey?.toString() ?? '']
                    ?.price
                }`
              ) : (
                <Empty>{'—'}</Empty>
              )}
            </TCell>
          )}
          {showPriceChange && (
            <ChangeCell
              change={putChange}
              align="right"
              style={putCellStyle}
              onClick={() => openBuySellModal('put')}
            >
              {putChange ? `${putChange.toFixed(1)}%` : <Empty>{'—'}</Empty>}
            </ChangeCell>
          )}
          {showVolume && (
            <TCell
              align="right"
              style={putCellStyle}
              onClick={() => openBuySellModal('put')}
            >
              {marketTrackerData?.[row.put?.serumMarketKey?.toString() ?? '']
                ?.volBase24h || <Empty>{'—'}</Empty>}
            </TCell>
          )}
          {showOI && (
            <TCell
              align="right"
              style={putCellStyle}
              onClick={() => openBuySellModal('put')}
            >
              {putOptionMintInfo?.supply.toString() || <Empty>{'—'}</Empty>}
            </TCell>
          )}
        </>
      )}
      <TCell align="right" style={putCellStyle} width={'120px'}>
        {row.put?.initialized ? (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => openBuySellModal('put')}
          >
            Buy/Sell
          </Button>
        ) : null}
      </TCell>
    </TRow>
  );
};

export default CallPutRow;
