import { Box, makeStyles, useMediaQuery } from '@material-ui/core';
import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import CreateIcon from '@material-ui/icons/Create';
import BarChartIcon from '@material-ui/icons/BarChart';

import TabCustom from '../Tab';
import PositionRow from './PositionRow';
import OpenPositionsTableHeader from './OpenPositionsTableHeader';
import { Heading } from './Heading';
import EmptySvg from './EmptySvg';
import useWallet from '../../hooks/useWallet';
import useOpenPositions from '../../hooks/useOpenPositions';
import useOptionsMarkets from '../../hooks/useOptionsMarkets';
import { useWrittenOptions } from '../../hooks/useWrittenOptions';
import { PricesProvider } from '../../context/PricesContext';
import Page from '../pages/Page';
import SupportedAssetBalances from '../SupportedAssetBalances';
import WrittenOptionsTable from '../WrittenOptionsTable/WrittenOptionsTable';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    justifyContent: 'flex-start',
    flexDirection: 'column',
    height: '100%',
    minHeight: '500px',
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(4),
  },
  tabsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  desktopColumns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 2fr 1fr 1fr',
    alignItems: 'center',
  },
  mobileColumns: {
    display: 'grid',
    gridTemplateColumns: '2fr 1.5fr 1fr 1fr',
    alignItems: 'center',
  },
  openPositionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    backgroundColor: theme.palette.background.medium,
    minHeight: '514px',
  },
  mainColor: {
    color: theme.palette.border.main,
  },
  emptySVGContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    padding: theme.spacing(3),
    flexGrow: 1,
  },
  writtenOptionsContainer: {
    backgroundColor: theme.palette.background.medium,
  },
}));

const OpenPositions: React.VFC = () => {
  const classes = useStyles();
  const mobileDevice = !useMediaQuery('(min-width:376px)');
  const tabletDevice = !useMediaQuery('(min-width:881px)');
  const { connected } = useWallet();
  const [page] = useState(0);
  const [rowsPerPage] = useState(10);
  const positions = useOpenPositions();
  const { markets } = useOptionsMarkets();
  const [selectedTab, setSelectedTab] = useState(0);
  const writtenOptions = useWrittenOptions();

  // #TODO: move this all the way up in the tree
  const isDesktop = !mobileDevice && !tabletDevice;
  const formFactor = isDesktop ? 'desktop' : mobileDevice ? 'mobile' : 'tablet';

  const positionRows = useMemo(
    () =>
      Object.keys(positions)
        .map((key) => ({
          accounts: positions[key],
          assetPair: `${markets[key]?.uAssetSymbol}-${markets[key]?.qAssetSymbol}`,
          expiration: markets[key]?.expiration,
          size: positions[key]?.reduce(
            (acc, tokenAccount) => acc + tokenAccount.amount,
            0,
          ),
          strike: markets[key]?.strike,
          strikePrice: markets[key]?.strikePrice,
          market: markets[key],
          qAssetMintAddress: markets[key]?.qAssetMint,
          uAssetMintAddress: markets[key]?.uAssetMint,
          qAssetSymbol: markets[key]?.qAssetSymbol,
          uAssetSymbol: markets[key]?.uAssetSymbol,
          amountPerContract: markets[key]?.amountPerContract,
          quoteAmountPerContract: markets[key]?.quoteAmountPerContract,
        }))
        .sort((rowA, rowB) => {
          return rowB?.expiration - rowA?.expiration;
        }),
    [positions, markets],
  );

  const hasOpenPositions = positionRows.length > 0;

  const writtenOptionKeys = useMemo(
    () => Object.keys(writtenOptions),
    [writtenOptions],
  );

  return (
    <PricesProvider>
      <Page>
        <Box className={classes.root}>
          <Box pb={2}>
            <SupportedAssetBalances />
          </Box>
          <Box className={classes.tabsContainer}>
            <TabCustom
              selected={selectedTab === 0}
              onClick={() => setSelectedTab(0)}
            >
              <Box display="flex" flexDirection="row" alignItems="center">
                {formFactor === 'desktop' && (
                  <Box px={1}>
                    <BarChartIcon />
                  </Box>
                )}
                <Box px={1} textAlign="left" lineHeight={'22px'}>
                  <Box fontSize={'16px'} fontWeight={700}>
                    Open Positions
                  </Box>
                  <Box fontSize={'13px'}>
                    {positionRows.length} currently open
                  </Box>
                </Box>
              </Box>
            </TabCustom>
            <TabCustom
              selected={selectedTab === 1}
              onClick={() => setSelectedTab(1)}
            >
              <Box display="flex" flexDirection="row" alignItems="center">
                {formFactor === 'desktop' && (
                  <Box px={1}>
                    <CreateIcon fontSize="small" />
                  </Box>
                )}
                <Box px={1} textAlign="left" lineHeight={'22px'}>
                  <Box fontSize={'16px'} fontWeight={700}>
                    Written Options
                  </Box>
                  <Box fontSize={'13px'}>
                    {writtenOptionKeys.length} currently written
                  </Box>
                </Box>
              </Box>
            </TabCustom>
          </Box>
          {selectedTab === 0 && (
            <Box className={classes.openPositionsContainer}>
              <Heading>Open Positions</Heading>
              <OpenPositionsTableHeader
                formFactor={formFactor}
                className={clsx(
                  classes.desktopColumns,
                  !isDesktop && classes.mobileColumns,
                )}
              />
              {hasOpenPositions && connected ? (
                positionRows
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <PositionRow
                      key={row.market.optionMintKey.toString()}
                      row={row}
                      formFactor={formFactor}
                      className={clsx(
                        classes.desktopColumns,
                        !isDesktop && classes.mobileColumns,
                      )}
                    />
                  ))
              ) : (
                <Box className={classes.emptySVGContainer}>
                  <EmptySvg />
                  <Box className={classes.mainColor}>
                    {connected
                      ? 'You have no open positions'
                      : 'Wallet not connected'}
                  </Box>
                </Box>
              )}
            </Box>
          )}
          {selectedTab === 1 && (
            <Box className={classes.writtenOptionsContainer}>
              <WrittenOptionsTable
                formFactor={formFactor}
                className={clsx(
                  classes.desktopColumns,
                  !isDesktop && classes.mobileColumns,
                )}
              />
            </Box>
          )}
        </Box>
      </Page>
    </PricesProvider>
  );
};

export default OpenPositions;
