import { Box, makeStyles } from '@material-ui/core';
import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import CreateIcon from '@material-ui/icons/Create';
import BarChartIcon from '@material-ui/icons/BarChart';
import AttachMoney from '@material-ui/icons/AttachMoney';
import ShoppingCart from '@material-ui/icons/ShoppingCart';
import { OptionMarket, TokenAccount } from '../../types';
import { BigNumber } from 'bignumber.js';
import Page from '../pages/Page';
import TabCustom from '../Tab';
import useOpenPositions from '../../hooks/useOpenPositions';
import WrittenOptionsTable from './WrittenOptionsTable';
import { useWrittenOptions } from '../../hooks/useWrittenOptions';
import SupportedAssetBalances from '../SupportedAssetBalances';
import { PricesProvider } from '../../context/PricesContext';
import OpenPositionsTable from './OpenPositionsTable';
import OpenOrders from '../OpenOrders';
import UnsettledBalancesTable from '../UnsettledBalancesTable';
import useScreenSize from '../../hooks/useScreenSize';
import { PublicKey } from '@solana/web3.js';
import { ExpiredOpenOrdersTable } from './ExpiredOpenOrdersTable';

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
  desktopTab: {
    padding: '0 8px 0 8px',
    lineHeight: '22px',
  },
  mobileTab: {
    padding: '0 4px 0 4px',
    lineHeight: '16px',
  },
  desktopTabHeader: {
    fontSize: 16,
    fontWeight: 700,
  },
  mobileTabHeader: {
    fontSize: 13,
    fontWeight: 600,
  },
}));

export type OldPosition = {
  accounts: TokenAccount[];
  assetPair: string;
  expiration: number;
  size: number;
  strike: BigNumber;
  strikePrice: string | undefined;
  market: OptionMarket;
  qAssetMintAddress: string;
  uAssetMintAddress: string;
  qAssetSymbol: string;
  uAssetSymbol: string;
  amountPerContract: BigNumber;
  quoteAmountPerContract: BigNumber;
};

export type Position = {
  accounts: TokenAccount[];
  optionKey: PublicKey;
};

const Portfolio: React.VFC = () => {
  const classes = useStyles();
  const positions = useOpenPositions();
  const [selectedTab, setSelectedTab] = useState(0);
  const writtenOptions = useWrittenOptions();
  const { formFactor } = useScreenSize();
  const isDesktop = formFactor === 'desktop';
  const isMobile = formFactor === 'mobile';

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
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                style={{ minHeight: '66px' }}
              >
                {isDesktop && <AttachMoney fontSize="small" />}
                <Box
                  className={isMobile ? classes.mobileTab : classes.desktopTab}
                  textAlign="left"
                >
                  <Box
                    className={
                      isMobile
                        ? classes.mobileTabHeader
                        : classes.desktopTabHeader
                    }
                  >
                    Unsettled Funds
                  </Box>
                </Box>
              </Box>
            </TabCustom>
            <TabCustom
              selected={selectedTab === 1}
              onClick={() => setSelectedTab(1)}
            >
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                style={{ minHeight: '66px' }}
              >
                {isDesktop && <ShoppingCart fontSize="small" />}
                <Box
                  className={isMobile ? classes.mobileTab : classes.desktopTab}
                  textAlign="left"
                >
                  <Box
                    className={
                      isMobile
                        ? classes.mobileTabHeader
                        : classes.desktopTabHeader
                    }
                  >
                    Open Orders
                  </Box>
                </Box>
              </Box>
            </TabCustom>
            <TabCustom
              selected={selectedTab === 2}
              onClick={() => setSelectedTab(2)}
            >
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                style={{ minHeight: '66px' }}
              >
                {isDesktop && <BarChartIcon />}
                <Box
                  className={isMobile ? classes.mobileTab : classes.desktopTab}
                  textAlign="left"
                >
                  <Box
                    className={
                      isMobile
                        ? classes.mobileTabHeader
                        : classes.desktopTabHeader
                    }
                  >
                    Bought Options
                  </Box>
                  <Box fontSize={isMobile ? '10px' : '13px'}>
                    {Object.keys(positions).length} open
                  </Box>
                </Box>
              </Box>
            </TabCustom>
            <TabCustom
              selected={selectedTab === 3}
              onClick={() => setSelectedTab(3)}
            >
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                style={{ minHeight: '66px' }}
              >
                {isDesktop && <CreateIcon fontSize="small" />}
                <Box
                  className={isMobile ? classes.mobileTab : classes.desktopTab}
                  textAlign="left"
                >
                  <Box
                    className={
                      isMobile
                        ? classes.mobileTabHeader
                        : classes.desktopTabHeader
                    }
                  >
                    Written Options
                  </Box>
                  <Box fontSize={isMobile ? '10px' : '13px'}>
                    {writtenOptionKeys.length} written
                  </Box>
                </Box>
              </Box>
            </TabCustom>
            <TabCustom
              selected={selectedTab === 4}
              onClick={() => setSelectedTab(4)}
            >
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                style={{ minHeight: '66px' }}
              >
                <Box
                  className={isMobile ? classes.mobileTab : classes.desktopTab}
                  textAlign="left"
                >
                  <Box
                    className={
                      isMobile
                        ? classes.mobileTabHeader
                        : classes.desktopTabHeader
                    }
                  >
                    Expired Options
                    <br />
                    "OpenOrders"
                  </Box>
                </Box>
              </Box>
            </TabCustom>
          </Box>
          {selectedTab === 0 && <UnsettledBalancesTable />}
          {selectedTab === 1 && <OpenOrders />}
          {selectedTab === 2 && (
            <OpenPositionsTable
              className={clsx(
                classes.desktopColumns,
                !isDesktop && classes.mobileColumns,
              )}
            />
          )}
          {selectedTab === 3 && <WrittenOptionsTable />}
          {selectedTab === 4 && <ExpiredOpenOrdersTable />}
        </Box>
      </Page>
    </PricesProvider>
  );
};

export default Portfolio;
