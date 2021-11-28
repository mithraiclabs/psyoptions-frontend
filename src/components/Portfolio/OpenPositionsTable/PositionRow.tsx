import React, { Fragment, useCallback, useMemo, useState } from 'react';
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
import ExerciseDialog from '../ExerciseDialog';
import { formatExpirationTimestamp } from '../../../utils/format';
import { TokenAccount } from '../../../types';
import { usePrices } from '../../../context/PricesContext';
import useScreenSize from '../../../hooks/useScreenSize';
import { TCell, TMobileCell } from '../../StyledComponents/Table/TableStyles';
import { PublicKey } from '@solana/web3.js';
import { useRecoilValue } from 'recoil';
import { optionsMap } from '../../../recoil';
import { BN } from '@project-serum/anchor';
import { useNormalizedStrikePriceFromOption } from '../../../hooks/useNormalizedStrikePriceFromOption';
import { useTokenByMint } from '../../../hooks/useNetworkTokens';
import { useOptionIsCall } from '../../../hooks/useOptionIsCall';
import { useOptionContractSize } from '../../../hooks/useOptionContractSize';

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
  accounts: TokenAccount[];
  optionKey: PublicKey;
  className: string;
}> = ({ accounts, className, optionKey }) => {
  const { formFactor } = useScreenSize();
  const option = useRecoilValue(optionsMap(optionKey.toString()));
  const classes = useStyles();
  const [visible, setVisible] = useState(false);
  const { prices } = usePrices();
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const optionUnderlyingAsset = useTokenByMint(
    option?.underlyingAssetMint ?? '',
  );
  const optionQuoteAsset = useTokenByMint(option?.quoteAssetMint ?? '');
  // NOTE: since there can be MANY underlying assets in these PositionRows
  // we make the assumption that it is a Put whenever the option's
  // underlying asset is USDC. Otherwise it is a call.
  const isCall = useOptionIsCall(optionKey);
  const contractSize = useOptionContractSize(optionKey);
  const strike = useNormalizedStrikePriceFromOption(
    optionKey.toString(),
    isCall,
  );
  const expired = useMemo(() => {
    const nowInSeconds = Date.now() / 1000;
    return !!option?.expirationUnixTimestamp.lt(new BN(nowInSeconds));
  }, [option?.expirationUnixTimestamp]);
  const size = useMemo(
    () => accounts.reduce((acc, account) => (acc += account.amount), 0),
    [accounts],
  );
  const optionUnderlyingAssetSymbol =
    optionUnderlyingAsset?.symbol ??
    option?.underlyingAssetMint.toString() ??
    '';
  const optionQuoteAssetSymbol =
    optionQuoteAsset?.symbol ?? option?.quoteAssetMint.toString() ?? '';
  // must normalize the underlying/quote assets based on whether the option is a call
  const underlyingAssetSymbol = isCall
    ? optionUnderlyingAssetSymbol
    : optionQuoteAssetSymbol;
  const price = prices[underlyingAssetSymbol];
  const underlyingAssetLogo = isCall
    ? optionUnderlyingAsset?.logoURI
    : optionQuoteAsset?.logoURI;

  const onRowClick = () => {
    if (accounts.length > 1) {
      setVisible((vis) => !vis);
    }
  };

  const openExerciseDialog = useCallback(() => {
    setExerciseDialogOpen(true);
  }, []);

  return (
    <>
      <ExerciseDialog
        open={exerciseDialogOpen}
        onClose={() => setExerciseDialogOpen(false)}
        optionKey={optionKey}
      />
      <TableRow tabIndex={-1} key={optionKey.toString()}>
        {formFactor === 'desktop' ? (
          <>
            <TCell>
              <Box className={classes.row}>
                <Avatar className={classes.avatar} src={underlyingAssetLogo}>
                  {underlyingAssetSymbol.slice(0, 1)}
                </Avatar>
                <Box pl={1}>{underlyingAssetSymbol}</Box>
              </Box>
            </TCell>
            <TCell>{isCall ? 'Call' : 'Put'}</TCell>
            <TCell>{strike.toString()}</TCell>
            <TCell>{price ? `$${price.toFixed(2)}` : '-'}</TCell>
            <TCell>{contractSize.toString()}</TCell>
            <TCell>{size}</TCell>
            <TCell>
              {formatExpirationTimestamp(
                option?.expirationUnixTimestamp.toNumber() ?? 0,
              )}
            </TCell>
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
                {accounts.length > 1 && (
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
                <Avatar className={classes.avatar} src={underlyingAssetLogo}>
                  {underlyingAssetSymbol.slice(0, 1)}
                </Avatar>
                <Box className={classes.rowWrap}>
                  <Box
                    pl={formFactor === 'mobile' ? 1 : 2}
                    className={classes.column}
                  >
                    <Box>{`${underlyingAssetSymbol} | ${
                      isCall ? 'Call' : 'Put'
                    }`}</Box>
                    <Box>{`Strike: ${strike.toString()}`}</Box>
                  </Box>
                  <Box
                    pl={formFactor === 'mobile' ? 1 : 2}
                    className={classes.column}
                  >
                    <Box>{`Size: ${contractSize.toString()}`}</Box>
                    <Box>{`Qty: ${size}`}</Box>
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
              {formatExpirationTimestamp(
                option?.expirationUnixTimestamp.toNumber() ?? 0,
              )}
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
                {accounts.length > 1 && (
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
            key={`${option?.optionMint.toString()}Collapsible`}
            in={visible}
            timeout="auto"
            unmountOnExit
            component="tr"
            style={{ display: 'block' }}
          >
            <td>
              {accounts.map((account) => (
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
                      ? contractSize.toString()
                      : `Size: ${contractSize.toString()}`}
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
