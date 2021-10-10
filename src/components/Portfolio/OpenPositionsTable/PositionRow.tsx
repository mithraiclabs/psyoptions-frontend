import React, { Fragment, useCallback, useState } from 'react';
import clsx from "clsx";
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import {
  Avatar,
  Box,
  Button,
  Collapse,
  makeStyles,
} from '@material-ui/core';
import BigNumber from 'bignumber.js';
import ExerciseDialog from '../ExerciseDialog';
import useAssetList from '../../../hooks/useAssetList';
import {
  formatExpirationTimestamp,
  formatExpirationTimestampDate,
} from '../../../utils/format';
import { OptionMarket, OptionType, TokenAccount } from '../../../types';
import { usePrices } from '../../../context/PricesContext';

const useStyles = makeStyles((theme) => ({
  root: {},
  mobile: {
    fontSize: "10px",
  },
  tablet: {
    fontSize: "12px",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  rowWrap: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    flexFlow: "wrap"
  },
  column: {
    display: "flex",
    flexDirection: "column",
  },
  avatar: {
    width: 24,
    height: 24,
  },
  dropdownOpen: {
    transform: 'rotate(-180deg)',
  },
  dropdownClosed: {
    transform: 'rotate(0)',
  },
  errorColor: {
    color: theme.palette.error.main,
  },
}));

const PositionRow: React.VFC<{
  row: {
    accounts: TokenAccount[];
    assetPair: string;
    expiration: number;
    market: OptionMarket;
    size: number;
    strikePrice: string | undefined;
    qAssetSymbol: string;
    qAssetMintAddress: string;
    uAssetSymbol: string;
    uAssetMintAddress: string;
    amountPerContract: BigNumber;
    quoteAmountPerContract: BigNumber;
  };
  className: string;
  formFactor: "desktop" | "tablet" | "mobile";
}> = ({ row, className, formFactor }) => {
  const classes = useStyles();
  const [visible, setVisible] = useState(false);
  const { supportedAssets } = useAssetList();
  const { prices } = usePrices();
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);

  const nowInSeconds = Date.now() / 1000;
  const expired = row.expiration <= nowInSeconds;

  const optionType = row?.uAssetSymbol?.match(/^USD/)
    ? OptionType.PUT
    : OptionType.CALL;

  const price =
    optionType === OptionType.CALL
      ? prices[row?.uAssetSymbol]
      : prices[row?.qAssetSymbol];

  const strike =
    optionType === OptionType.PUT
      ? row.amountPerContract.dividedBy(row.quoteAmountPerContract).toString()
      : row.market.strike.toString(10);

  const contractSize =
    optionType === OptionType.CALL
      ? row.amountPerContract.toString()
      : row.quoteAmountPerContract.toString();

  const onRowClick = () => {
    if (row.accounts.length > 1) {
      setVisible((vis) => !vis);
    }
  };

  const openExerciseDialog = useCallback(() => {
    setExerciseDialogOpen(true);
  }, []);

  const uAssetSymbol =
    optionType === 'put' ? row?.qAssetSymbol : row?.uAssetSymbol;

  const qAssetSymbol =
    optionType === 'put' ? row?.uAssetSymbol : row?.qAssetSymbol;

  const uAssetImage = supportedAssets.find(
    (asset) =>
      asset?.mintAddress ===
      (optionType === 'put' ? row?.qAssetMintAddress : row?.uAssetMintAddress),
  )?.icon;

  return (
    <>
      <ExerciseDialog
        open={exerciseDialogOpen}
        onClose={() => setExerciseDialogOpen(false)}
        positionSize={row.size}
        uAssetSymbol={uAssetSymbol}
        uAssetMintAddress={row?.uAssetMintAddress}
        qAssetSymbol={qAssetSymbol}
        qAssetMintAddress={row?.qAssetMintAddress}
        optionType={optionType}
        contractSize={contractSize}
        strike={strike}
        expiration={formatExpirationTimestampDate(row.expiration)}
        price={price}
        option={row.market}
      />
      <Box
        onClick={onRowClick}
        role="checkbox"
        tabIndex={-1}
        key={row.market.optionMintKey.toString()}
        p={1}
        className={clsx(classes.root,
          className,
          formFactor === "tablet" && classes.tablet,
          formFactor === "mobile" && classes.mobile)}
      >
        <Box
          pr={1}
          pl={1}
          className={classes.row}
        >
          {formFactor === "desktop" ? (<Fragment>
            <Avatar className={classes.avatar} src={uAssetImage}>
              {uAssetSymbol.slice(0, 1)}
            </Avatar>
            <Box pl={1}>{uAssetSymbol}</Box>
            </Fragment>) : (<Fragment>
              <Avatar className={classes.avatar} src={uAssetImage}>
              {uAssetSymbol.slice(0, 1)}
            </Avatar>
            <Box className={classes.rowWrap}>
              <Box pl={formFactor === "mobile" ? 1 : 2} className={classes.column}>
                <Box>{`${uAssetSymbol} | ${optionType}`}</Box>
                <Box>{`Strike: ${strike}`}</Box>
              </Box>
              <Box pl={formFactor === "mobile" ? 1 : 2} className={classes.column}>
                <Box>{`Size: ${contractSize}`}</Box>
                <Box>{`Qty: ${row.size}`}</Box>
              </Box>
            </Box>
          </Fragment>)}
        </Box>
        {formFactor === "desktop" && <Fragment><Box pl={1} pr={1}>
            {optionType}
          </Box>
          <Box pr={1}>
            {strike}
          </Box>
          <Box pr={1}>
            {price ? `$${price.toFixed(2)}` : '-'}
          </Box>
          <Box pr={1}>
            {contractSize}
          </Box>
          <Box pr={1}>
            {row.size}
          </Box>
        </Fragment>}
        <Box pr={1}>
          {formatExpirationTimestamp(row.expiration)}
        </Box>
        <Box pr={1}>{`+$0.00`}</Box>
        <Box className={classes.row} justifySelf="center">
          {expired && <Box className={classes.errorColor}>Expired</Box>}
          {!expired && (
            <Box>
              <Button
                color="primary"
                variant="outlined"
                onClick={openExerciseDialog}
                size={formFactor === "mobile" ? "small" : "large"}
              >
                Exercise
              </Button>
            </Box>
          )}
          {row.accounts.length > 1 && (
            <KeyboardArrowDown
              className={
                visible ? classes.dropdownOpen : classes.dropdownClosed
              }
            />
          )}
        </Box>
      </Box>
      <Box key={`${row.market.optionMintKey}Collapsible`}>
        <Collapse in={visible} timeout="auto" unmountOnExit>
          <Box>
            {row.accounts.map((account) => (
              <Box
                key={`${account?.pubKey}`}
                className={clsx(classes.root,
                  className,
                  formFactor === "mobile" && classes.mobile,
                  formFactor === "tablet" && classes.tablet)}
                p={1}
              >
                {formFactor === "desktop" && <Fragment><Box/>
                  <Box/>
                  <Box/>
                  <Box/>
                </Fragment>}
                <Box pr={1}>
                  {formFactor === "desktop" ? contractSize : `Size: ${contractSize}`}
                </Box>
                <Box pr={1}>
                {formFactor === "desktop" ? account.amount : `Qty: ${account.amount}`}
                </Box>
                {formFactor === "desktop" && <Fragment>
                  <Box/>
                </Fragment>}
                <Box pr={1}>{`+$0.00`}</Box>
                <Box justifySelf="center">
                  {expired && (
                    <Box className={classes.errorColor}>Expired</Box>
                  )}
                  {!expired && (
                    <Box>
                      <Button
                        color="primary"
                        variant="outlined"
                        onClick={openExerciseDialog}
                        size={formFactor === "mobile" ? "small" : "large"}
                      >
                        Exercise
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Collapse>
      </Box>
    </>
  );
};

export default React.memo(PositionRow);
