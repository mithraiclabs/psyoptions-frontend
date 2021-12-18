import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { Box, TableRow, makeStyles } from '@material-ui/core';
import moment from 'moment';
import BigNumber from 'bignumber.js';
import { PublicKey } from '@solana/web3.js';
import useSerum from '../../hooks/useSerum';
import { useSettleFunds, useUnsettledFundsForMarket } from '../../hooks/Serum';
import { TCell, TMobileCell } from '../StyledComponents/Table/TableStyles';
import TxButton from '../TxButton';
import useOptionsMarkets from '../../hooks/useOptionsMarkets';
import useScreenSize from '../../hooks/useScreenSize';
import { useSubscribeSerumOrderbook } from '../../hooks/Serum';
import { useRecoilValue } from 'recoil';
import { optionsMap } from '../../recoil';
import { useTokenByMint } from '../../hooks/useNetworkTokens';
import { useTokenMintInfo } from '../../hooks/useTokenMintInfo';
import { useNormalizedStrikePriceFromOption } from '../../hooks/useNormalizedStrikePriceFromOption';
import { useOptionIsCall } from '../../hooks/useOptionIsCall';
import { useOptionContractSize } from '../../hooks/useOptionContractSize';

const useStyles = makeStyles((theme) => ({
  root: {},
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowWrap: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexFlow: 'wrap',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  tabletFont: {
    fontSize: '14px !important',
  },
  mobileFont: {
    fontSize: '10px !important',
  },
}));

const Empty = ({ children }) => (
  <span style={{ opacity: '0.3' }}>{children}</span>
);

const UnsettledRow = ({
  serumMarketKey,
  unsettledFunds,
  settleFunds,
  optionKey,
}: {
  serumMarketKey: PublicKey;
  unsettledFunds: any;
  settleFunds: any;
  optionKey: PublicKey;
}) => {
  const classes = useStyles();
  const option = useRecoilValue(optionsMap(optionKey.toString()));
  const [loading, setLoading] = useState(false);
  const { formFactor } = useScreenSize();
  const contractSize = useOptionContractSize(optionKey);
  const isCall = useOptionIsCall(optionKey);
  const isMobile = formFactor === 'mobile';
  useSubscribeSerumOrderbook(serumMarketKey.toString());
  const optionUnderlyingAsset = useTokenByMint(
    option?.underlyingAssetMint ?? '',
  );
  const optionQuoteAsset = useTokenByMint(option?.quoteAssetMint ?? '');
  const optionUnderlyingAssetSymbol =
    optionUnderlyingAsset?.symbol ??
    option?.underlyingAssetMint.toString() ??
    '';
  const optionQuoteAssetSymbol =
    optionQuoteAsset?.symbol ?? option?.quoteAssetMint.toString() ?? '';
  const optionQuoteMintInfo = useTokenMintInfo(option?.quoteAssetMint);
  const strike = useNormalizedStrikePriceFromOption(optionKey.toString());
  const assetPair = isCall
    ? `${optionUnderlyingAssetSymbol} / ${optionQuoteAssetSymbol}`
    : `${optionQuoteAssetSymbol} / ${optionUnderlyingAssetSymbol}`;
  const normalizedUnderlyingSymbol = isCall
    ? optionUnderlyingAssetSymbol
    : optionQuoteAssetSymbol;
  const normalizedQuoteSymbol = isCall
    ? optionQuoteAssetSymbol
    : optionUnderlyingAssetSymbol;
  const optionQuoteAssetDecimals =
    optionQuoteMintInfo?.decimals ?? optionQuoteAsset?.decimals ?? 0;

  const handleSettleFunds = useCallback(async () => {
    setLoading(true);
    await settleFunds();
    setLoading(false);
  }, [settleFunds]);

  /**
   * This makes the assumption that the Serum market quote asset is the same
   * as the options quote asset
   */
  const unsettledAssets = useCallback(() => {
    const tokensUnsettled = new BigNumber(unsettledFunds.quoteFree.toString());
    if (
      tokensUnsettled.dividedBy(10 ** optionQuoteAssetDecimals).toString() ===
      '0'
    ) {
      return <Empty>{'-'}</Empty>;
    }
    return `${tokensUnsettled
      .dividedBy(10 ** optionQuoteAssetDecimals)
      .toString()} ${normalizedQuoteSymbol}`;
  }, [
    normalizedQuoteSymbol,
    optionQuoteAssetDecimals,
    unsettledFunds.quoteFree,
  ]);

  return (
    <TableRow
      key={`tr-unsettled-${serumMarketKey}`}
      className={
        formFactor === 'tablet'
          ? classes.tabletFont
          : formFactor === 'mobile'
          ? classes.mobileFont
          : ''
      }
    >
      {formFactor === 'desktop' ? (
        <>
          <TCell>{isCall ? 'Call' : 'Put'}</TCell>
          <TCell>{assetPair}</TCell>
          <TCell>
            {`${moment
              .utc((option?.expirationUnixTimestamp.toNumber() ?? 0) * 1000)
              .format('LL')} 23:59:59 UTC`}
          </TCell>
          <TCell>{strike.toString()}</TCell>
          <TCell>{`${contractSize} ${normalizedUnderlyingSymbol}`}</TCell>
          <TCell>{unsettledFunds.baseFree.toString()}</TCell>
          <TCell>{unsettledAssets()}</TCell>
          <TCell align="right">
            <TxButton
              variant="outlined"
              color="primary"
              onClick={handleSettleFunds}
              loading={loading}
            >
              {loading ? 'Settling Funds' : 'Settle Funds'}
            </TxButton>
          </TCell>
        </>
      ) : (
        <>
          <TMobileCell
            className={clsx(
              classes.rowWrap,
              formFactor === 'tablet' && classes.tabletFont,
              formFactor === 'mobile' && classes.mobileFont,
            )}
          >
            <Box pl={isMobile ? 1 : 2} className={classes.column}>
              <Box className={classes.uppercase}>{isCall ? 'Call' : 'Put'}</Box>
              <Box>{assetPair}</Box>
            </Box>
            <Box pl={isMobile ? 1 : 2} className={classes.column}>
              <Box>{`Strike: ${strike.toString()}`}</Box>
              <Box>{`${contractSize} ${normalizedUnderlyingSymbol}`}</Box>
              <Box>{`Qty: ${unsettledFunds.baseFree.toString()}`}</Box>
            </Box>
          </TMobileCell>
          <TMobileCell
            className={clsx(
              formFactor === 'tablet' && classes.tabletFont,
              formFactor === 'mobile' && classes.mobileFont,
            )}
          >
            {`${moment
              .utc((option?.expirationUnixTimestamp.toNumber() ?? 0) * 1000)
              .format('LL')} 23:59:59 UTC`}
          </TMobileCell>
          <TMobileCell
            className={clsx(
              formFactor === 'tablet' && classes.tabletFont,
              formFactor === 'mobile' && classes.mobileFont,
            )}
          >
            {unsettledAssets()}
          </TMobileCell>
          <TMobileCell
            align="right"
            className={clsx(
              formFactor === 'tablet' && classes.tabletFont,
              formFactor === 'mobile' && classes.mobileFont,
            )}
          >
            <TxButton
              variant="outlined"
              color="primary"
              onClick={handleSettleFunds}
              loading={loading}
              size={isMobile ? 'small' : 'large'}
            >
              {loading ? 'Settling...' : 'Settle Funds'}
            </TxButton>
          </TMobileCell>
        </>
      )}
    </TableRow>
  );
};

// Render all unsettled balances for a given market as table rows
const UnsettledBalancesRow: React.FC<{
  serumMarketKey: PublicKey;
  optionKey: PublicKey;
}> = ({ serumMarketKey, optionKey }) => {
  const { marketsBySerumKey } = useOptionsMarkets();
  const { serumMarkets } = useSerum();
  const serumMarketAddress = serumMarketKey.toString();
  const { serumMarket } = serumMarkets[serumMarketAddress] || {};
  const optionMarket = marketsBySerumKey[serumMarketAddress];
  const { settleFunds } = useSettleFunds(
    serumMarketAddress,
    optionMarket,
    optionKey,
  );
  const unsettledFunds = useUnsettledFundsForMarket(serumMarketAddress);

  if (
    !serumMarket ||
    (unsettledFunds.baseFree.toNumber() <= 0 &&
      unsettledFunds.quoteFree.toNumber() <= 0)
  ) {
    return null;
  }

  return (
    <UnsettledRow
      serumMarketKey={serumMarketKey}
      unsettledFunds={unsettledFunds}
      settleFunds={settleFunds}
      optionKey={optionKey}
    />
  );
};

export default React.memo(UnsettledBalancesRow);
