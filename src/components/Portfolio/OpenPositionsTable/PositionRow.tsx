import React, { Fragment, useCallback, useState } from 'react';
import clsx from 'clsx';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';
import {
  Avatar,
  Box,
  Button,
  Collapse,
  IconButton,
  makeStyles,
  TableCell,
  TableRow,
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
import useScreenSize from '../../../hooks/useScreenSize';
import { TCell, TMobileCell } from '../../StyledComponents/Table/TableStyles';

const useStyles = makeStyles((theme) => ({
  root: {},
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  minRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: 'min-content',
  },
  rowWrap: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexFlow: 'wrap',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  avatar: {
    width: 24,
    height: 24,
  },
  centerText: {
    textAlign: 'center',
  },
  errorColor: {
    color: theme.palette.error.main,
  },
  tabletFont: {
    fontSize: '14px !important',
  },
  mobileFont: {
    fontSize: '10px !important',
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
}> = ({ row, className }) => {
  const classes = useStyles();
  const [visible, setVisible] = useState(false);
  const { supportedAssets } = useAssetList();
  const { prices } = usePrices();
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const { formFactor } = useScreenSize();

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
      <TableRow tabIndex={-1} key={row.market.optionMintKey.toString()}>
        {formFactor === 'desktop' ? (
          <>
            <TCell>
              <Box className={classes.row}>
                <Avatar className={classes.avatar} src={uAssetImage}>
                  {uAssetSymbol.slice(0, 1)}
                </Avatar>
                <Box pl={1}>{uAssetSymbol}</Box>
              </Box>
            </TCell>
            <TCell>{optionType}</TCell>
            <TCell>{strike}</TCell>
            <TCell>{price ? `$${price.toFixed(2)}` : '-'}</TCell>
            <TCell>{contractSize}</TCell>
            <TCell>{row.size}</TCell>
            <TCell>{formatExpirationTimestamp(row.expiration)}</TCell>
            <TCell style={{ width: '0.1%', whiteSpace: 'nowrap' }}>
              <Box className={classes.minRow}>
                {expired ? (
                  <Box className={classes.errorColor}>Expired</Box>
                ) : (
                  <Box>
                    <Button
                      color="primary"
                      variant="outlined"
                      onClick={openExerciseDialog}
                      size="large"
                    >
                      Exercise
                    </Button>
                  </Box>
                )}
                {row.accounts.length > 1 && (
                  <IconButton onClick={onRowClick}>
                    {visible ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                  </IconButton>
                )}
              </Box>
            </TCell>
          </>
        ) : (
          <>
            <TMobileCell>
              <Box
                className={clsx(
                  classes.row,
                  formFactor === 'tablet' && classes.tabletFont,
                  formFactor === 'mobile' && classes.mobileFont,
                )}
              >
                <Avatar className={classes.avatar} src={uAssetImage}>
                  {uAssetSymbol.slice(0, 1)}
                </Avatar>
                <Box className={classes.rowWrap}>
                  <Box
                    pl={formFactor === 'mobile' ? 1 : 2}
                    className={classes.column}
                  >
                    <Box>{`${uAssetSymbol} | ${optionType}`}</Box>
                    <Box>{`Strike: ${strike}`}</Box>
                  </Box>
                  <Box
                    pl={formFactor === 'mobile' ? 1 : 2}
                    className={classes.column}
                  >
                    <Box>{`Size: ${contractSize}`}</Box>
                    <Box>{`Qty: ${row.size}`}</Box>
                  </Box>
                </Box>
              </Box>
            </TMobileCell>
            <TMobileCell
              className={clsx(
                formFactor === 'tablet' && classes.tabletFont,
                formFactor === 'mobile' && classes.mobileFont,
              )}
            >
              {formatExpirationTimestamp(row.expiration)}
            </TMobileCell>
            <TMobileCell
              style={{ width: '0.1%', whiteSpace: 'nowrap' }}
              className={clsx(
                formFactor === 'tablet' && classes.tabletFont,
                formFactor === 'mobile' && classes.mobileFont,
              )}
            >
              <Box
                className={
                  formFactor === 'mobile' ? classes.centerText : classes.minRow
                }
              >
                {expired ? (
                  <Box className={classes.errorColor}>Expired</Box>
                ) : (
                  <Box>
                    <Button
                      color="primary"
                      variant="outlined"
                      onClick={openExerciseDialog}
                      size={formFactor === 'mobile' ? 'small' : 'large'}
                    >
                      Exercise
                    </Button>
                  </Box>
                )}
                {row.accounts.length > 1 && (
                  <IconButton onClick={onRowClick}>
                    {visible ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                  </IconButton>
                )}
              </Box>
            </TMobileCell>
          </>
        )}
      </TableRow>
      <TableRow>
        <TableCell
          colSpan={formFactor === 'mobile' ? 4 : 9}
          style={{ padding: 0, border: 'none' }}
        >
          <Collapse
            key={`${row.market.optionMintKey}Collapsible`}
            in={visible}
            timeout="auto"
            unmountOnExit
            component="tr"
            style={{ display: 'block' }}
          >
            <td>
              {row.accounts.map((account) => (
                <Box
                  key={`${account?.pubKey}`}
                  className={clsx(
                    classes.root,
                    className,
                    formFactor === 'mobile' && classes.mobileFont,
                    formFactor === 'tablet' && classes.tabletFont,
                  )}
                  p={1}
                >
                  {formFactor === 'desktop' && (
                    <Fragment>
                      <Box />
                      <Box />
                      <Box />
                      <Box />
                    </Fragment>
                  )}
                  <Box>
                    {formFactor === 'desktop'
                      ? contractSize
                      : `Size: ${contractSize}`}
                  </Box>
                  <Box>
                    {formFactor === 'desktop'
                      ? account.amount
                      : `Qty: ${account.amount}`}
                  </Box>
                  {formFactor === 'desktop' && (
                    <Fragment>
                      <Box />
                    </Fragment>
                  )}
                  <Box>
                    {expired && (
                      <Box className={classes.errorColor}>Expired</Box>
                    )}
                    {!expired && (
                      <Box>
                        <Button
                          color="primary"
                          variant="outlined"
                          onClick={openExerciseDialog}
                          size={formFactor === 'mobile' ? 'small' : 'large'}
                        >
                          Exercise
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </td>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default React.memo(PositionRow);
