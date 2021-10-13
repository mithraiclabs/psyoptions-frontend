import { Box, makeStyles } from '@material-ui/core';
import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import CreateIcon from '@material-ui/icons/Create';
import BarChartIcon from '@material-ui/icons/BarChart';
import AttachMoney from '@material-ui/icons/AttachMoney';
import ShoppingCart from '@material-ui/icons/ShoppingCart';
import { OptionMarket, TokenAccount } from "../../types";
import { BigNumber } from "bignumber.js";
import Page from '../pages/Page';
import TabCustom from '../Tab';
import useOpenPositions from '../../hooks/useOpenPositions';
import useOptionsMarkets from '../../hooks/useOptionsMarkets';
import WrittenOptionsTable from './WrittenOptionsTable';
import { useWrittenOptions } from '../../hooks/useWrittenOptions';
import SupportedAssetBalances from '../SupportedAssetBalances';
import { PricesProvider } from '../../context/PricesContext';
import OpenPositionsTable from "./OpenPositionsTable";
import OpenOrders from '../OpenOrders';
import UnsettledBalancesTable from '../UnsettledBalancesTable';
import useScreenSize from '../../hooks/useScreenSize';

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
}));

export type Position = {
  accounts: TokenAccount[];
  assetPair: string;
  expiration: number;
  size: number;
  strike: BigNumber;
  strikePrice: string | undefined;
  market: OptionMarket;
  qAssetMintAddress: string;
  uAssetMintAddress: string,
  qAssetSymbol: string,
  uAssetSymbol: string,
  amountPerContract: BigNumber,
  quoteAmountPerContract: BigNumber;
};

const Portfolio: React.VFC = () => {
  const classes = useStyles();
  const positions = useOpenPositions();
  const { marketsByUiKey } = useOptionsMarkets();
  const [selectedTab, setSelectedTab] = useState(0);
  const writtenOptions = useWrittenOptions();
  const { formFactor } = useScreenSize();

  const positionRows: Position[] = useMemo(() =>
    Object.keys(positions).map((key) => {
      const market = marketsByUiKey[key];
      return {
        accounts: positions[key],
        assetPair: `${market?.uAssetSymbol}-${market?.qAssetSymbol}`,
        expiration: market?.expiration,
        size: positions[key]?.reduce(
          (acc, tokenAccount) => acc + tokenAccount.amount,
          0,
        ),
        strike: market?.strike,
        strikePrice: market?.strikePrice,
        market: market,
        qAssetMintAddress: market?.qAssetMint,
        uAssetMintAddress: market?.uAssetMint,
        qAssetSymbol: market?.qAssetSymbol,
        uAssetSymbol: market?.uAssetSymbol,
        amountPerContract: market?.amountPerContract,
        quoteAmountPerContract: market?.quoteAmountPerContract,
      }
    })
    .sort((rowA, rowB) => {
      return rowB?.expiration - rowA?.expiration;
    }),
    [positions, marketsByUiKey],
  );

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
              <Box display="flex" flexDirection="row" alignItems="center"
                style={{ minHeight: "66px" }}>
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
              <Box display="flex" flexDirection="row" alignItems="center"
                style={{ minHeight: "66px" }}>
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
            <TabCustom
              selected={selectedTab === 2}
              onClick={() => setSelectedTab(2)}
            >
              <Box display="flex" flexDirection="row" alignItems="center"
                style={{ minHeight: "66px" }}>
                {formFactor === 'desktop' && (
                  <Box px={1}>
                    <ShoppingCart fontSize="small" />
                  </Box>
                )}
                <Box px={1} textAlign="left" lineHeight={'22px'}>
                  <Box fontSize={'16px'} fontWeight={700}>
                    Open Orders
                  </Box>
                </Box>
              </Box>
            </TabCustom>
            <TabCustom
              selected={selectedTab === 3}
              onClick={() => setSelectedTab(3)}
            >
              <Box display="flex" flexDirection="row" alignItems="center"
                style={{ minHeight: "66px" }}>
                {formFactor === 'desktop' && (
                  <Box px={1}>
                    <AttachMoney fontSize="small" />
                  </Box>
                )}
                <Box px={1} textAlign="left" lineHeight={'22px'}>
                  <Box fontSize={'16px'} fontWeight={700}>
                    Unsettled Funds
                  </Box>
                </Box>
              </Box>
            </TabCustom>
          </Box>
          {selectedTab === 0 && (
            <OpenPositionsTable
              positions={positionRows}
              className={clsx(classes.desktopColumns,
                formFactor !== 'desktop' && classes.mobileColumns)}
            />
          )}
          {selectedTab === 1 && (
            <WrittenOptionsTable
              className={clsx(classes.desktopColumns,
                formFactor !== 'desktop' && classes.mobileColumns)}
            />
          )}
          {selectedTab === 2 && (
            <OpenOrders />
          )}
          {selectedTab === 3 && (
            <UnsettledBalancesTable />
          )}
        </Box>
      </Page>
    </PricesProvider>
  );
};

export default Portfolio;
