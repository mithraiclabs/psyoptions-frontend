import React, { memo, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Tooltip,
  makeStyles,
  withStyles,
  TableRow,
} from '@material-ui/core';
import clsx from 'clsx';
import { formatExpirationTimestamp } from '../../../utils/format';
import useOwnedTokenAccounts from '../../../hooks/useOwnedTokenAccounts';
import { ClaimQuoteDialog } from './ClaimQuoteDialog';
import { WrittenOptionsClaimUnderlyingDialog } from '../../WrittenOptionsClaimUnderlyingDialog';
import { WrittenOptionsClosePositionPreExpiryDialog } from '../../WrittenOptionsClosePositionPreExpiryDialog';
import { useOptionVaultAmounts } from '../../../hooks/useOptionVaultAmounts';
import useScreenSize from '../../../hooks/useScreenSize';
import { TCell, TMobileCell } from '../../StyledComponents/Table/TableStyles';
import { PublicKey } from '@solana/web3.js';
import useOpenPositions from '../../../hooks/useOpenPositions';
import { useWrittenOptions } from '../../../hooks/useWrittenOptions';
import { useRecoilValue } from 'recoil';
import { optionsMap } from '../../../recoil';
import { BN } from '@project-serum/anchor';
import { useOptionIsCall } from '../../../hooks/useOptionIsCall';
import { useNormalizedStrikePriceFromOption } from '../../../hooks/useNormalizedStrikePriceFromOption';
import { useTokenByMint } from '../../../hooks/useNetworkTokens';
import { useNormalizeAmountOfMintBN } from '../../../hooks/useNormalizeAmountOfMintBN';

const StyledTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: theme.palette.background.lighter,
    maxWidth: 370,
    fontSize: '14px',
    lineHeight: '18px',
  },
}))(Tooltip);

const useStyles = makeStyles((theme) => ({
  root: {},
  mobile: {
    fontSize: '10px',
  },
  tablet: {
    fontSize: '14px',
  },
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
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  avatar: {
    width: 24,
    height: 24,
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

/**
 * Row to display the wallet's minted options
 *
 * Only closes a single expired option at a time right now.
 */
const WrittenOptionRow: React.VFC<{
  optionKey: PublicKey;
}> = ({ optionKey }) => {
  const option = useRecoilValue(optionsMap(optionKey.toString()));
  const positions = useOpenPositions();
  const writtenOptions = useWrittenOptions();
  const heldContracts = positions[optionKey.toString()] ?? [];
  const writerTokenAccounts = writtenOptions[optionKey.toString()] ?? [];
  const classes = useStyles();
  const { formFactor } = useScreenSize();
  const { ownedTokenAccounts } = useOwnedTokenAccounts();
  const normalizeOptionUnderlying = useNormalizeAmountOfMintBN(
    option?.underlyingAssetMint ?? null,
  );
  const normalizeOptionQuote = useNormalizeAmountOfMintBN(
    option?.quoteAssetMint ?? null,
  );
  const [claimQuoteVisible, setClaimQuoteVisible] = useState(false);
  const [closeWrittenOptionsVisible, setCloseWrittenOptionsVisible] =
    useState(false);
  const [
    closeWrittenOptionsPreExpiryVisible,
    setCloseWrittenOptionsPreExpiryVisible,
  ] = useState(false);
  const expired = useMemo(() => {
    const nowInSeconds = Date.now() / 1000;
    return !!option?.expirationUnixTimestamp.lt(new BN(nowInSeconds));
  }, [option?.expirationUnixTimestamp]);
  const [quoteVaultAmount, underlyingVaultAmount] =
    useOptionVaultAmounts(optionKey);
  const optionUnderlyingAsset = useTokenByMint(
    option?.underlyingAssetMint ?? '',
  );
  const optionQuoteAsset = useTokenByMint(option?.quoteAssetMint ?? '');
  const isCall = useOptionIsCall(optionKey);
  const strike = useNormalizedStrikePriceFromOption(
    optionKey.toString(),
    isCall,
  );
  const optionUnderlyingAssetSymbol =
    optionUnderlyingAsset?.symbol ??
    option?.underlyingAssetMint.toString() ??
    '';
  const optionQuoteAssetSymbol =
    optionQuoteAsset?.symbol ?? option?.quoteAssetMint.toString() ?? '';
  const underlyingAssetSymbol = isCall
    ? optionUnderlyingAssetSymbol
    : optionQuoteAssetSymbol;
  const quoteAssetSymbol = isCall
    ? optionQuoteAssetSymbol
    : optionUnderlyingAssetSymbol;
  const underlyingAssetLogo = isCall
    ? optionUnderlyingAsset?.logoURI
    : optionQuoteAsset?.logoURI;
  const writerTokenAccount = writerTokenAccounts[0];
  const walletUnderlyingAssetKey =
    ownedTokenAccounts[option?.underlyingAssetMint.toString() ?? '']?.[0]
      ?.pubKey;
  const walletQuoteAssetKey =
    ownedTokenAccounts[option?.quoteAssetMint.toString() ?? '']?.[0]?.pubKey;
  const ownedOptionTokenAccounts =
    ownedTokenAccounts[option?.optionMint.toString() ?? ''];
  const holdsContracts = !!heldContracts.length;
  const optionTokenAccount = ownedOptionTokenAccounts[0];
  // amount of underlying without taking into account call/put
  const normalizedOptionUnderlyingAmount = normalizeOptionUnderlying(
    option?.underlyingAmountPerContract,
  );
  const normalizedUnderlyingAmount = isCall
    ? normalizedOptionUnderlyingAmount
    : normalizeOptionQuote(option?.quoteAmountPerContract);

  const handleClaimQuote = () => {
    setClaimQuoteVisible(true);
  };
  const showCloseWrittenOptions = () => setCloseWrittenOptionsVisible(true);
  const showCloseWrittenOptionsPreExpiry = () =>
    setCloseWrittenOptionsPreExpiryVisible(true);

  const lockedAmount =
    writerTokenAccount.amount * normalizedOptionUnderlyingAmount.toNumber();
  const lockedAmountDisplay = `${lockedAmount}`.match(/\.(.{4,})$/)
    ? `≈${lockedAmount.toFixed(3)}`
    : lockedAmount;

  const canClose = (ownedOptionTokenAccounts?.[0]?.amount || 0) > 0;

  let ActionFragment: React.ReactNode = null;
  if (expired) {
    ActionFragment = (
      <>
        {!underlyingVaultAmount.isZero() && (
          <Box>
            <StyledTooltip
              title={
                <Box p={1}>
                  The written option has expired, closing will return the locked
                  underlying asset
                </Box>
              }
            >
              <Box
                display="flex"
                flexDirection={['column', 'column', 'row']}
                flexWrap="wrap"
                alignItems="flex-start"
                justifyContent="flex-start"
              >
                <Box p={1}>
                  <Button
                    color="primary"
                    variant="outlined"
                    onClick={showCloseWrittenOptions}
                    size={formFactor === 'mobile' ? 'small' : 'large'}
                  >
                    Claim {underlyingAssetSymbol}
                  </Button>
                </Box>
              </Box>
            </StyledTooltip>
          </Box>
        )}
        {!quoteVaultAmount.isZero() && (
          <StyledTooltip
            title={
              <Box p={1}>
                Some option contracts have been exercised. Burn the writer token
                to claim the quote asset and forfeit the locked underlying asset
              </Box>
            }
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="flex-start"
              p={1}
            >
              <Button
                color="primary"
                variant="outlined"
                onClick={handleClaimQuote}
                size={formFactor === 'mobile' ? 'small' : 'large'}
              >
                Claim {quoteAssetSymbol}
              </Button>
            </Box>
          </StyledTooltip>
        )}
      </>
    );
  } else {
    ActionFragment = (
      <Box>
        {holdsContracts && canClose && (
          <StyledTooltip
            title={
              <Box p={1}>
                Unlock the underlying asset used to write the contract by
                burning the option and writer tokens
              </Box>
            }
          >
            <Box
              display="flex"
              flexDirection={['column', 'column', 'row']}
              flexWrap="wrap"
              alignItems="flex-start"
              justifyContent="flex-start"
            >
              <Box p={1}>
                <Button
                  color="primary"
                  variant="outlined"
                  onClick={showCloseWrittenOptionsPreExpiry}
                  size={formFactor === 'mobile' ? 'small' : 'large'}
                >
                  Claim {underlyingAssetSymbol}
                </Button>
              </Box>
            </Box>
          </StyledTooltip>
        )}
        {!quoteVaultAmount.isZero() && (
          <StyledTooltip
            title={
              <Box p={1}>
                Some option contracts have been exercised. Burn the writer token
                to claim the quote asset and forfeit the locked underlying asset
              </Box>
            }
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="flex-start"
              p={1}
            >
              <Button
                color="primary"
                variant="outlined"
                onClick={handleClaimQuote}
                size={formFactor === 'mobile' ? 'small' : 'large'}
              >
                Claim {quoteAssetSymbol}
              </Button>
            </Box>
          </StyledTooltip>
        )}
      </Box>
    );
  }

  return (
    <>
      <TableRow
        key={optionKey.toString()}
        style={{ borderBottom: '1pt solid #ff000d' }}
      >
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
            <TCell>{ownedOptionTokenAccounts?.[0]?.amount}</TCell>
            <TCell>{normalizedUnderlyingAmount.toString()}</TCell>
            <TCell>{writerTokenAccount.amount}</TCell>
            <TCell>
              {expired ? (
                <Box className={classes.errorColor}>Expired</Box>
              ) : (
                formatExpirationTimestamp(
                  option?.expirationUnixTimestamp.toNumber() ?? 0,
                )
              )}
            </TCell>
            <TCell>
              {lockedAmountDisplay} {optionUnderlyingAssetSymbol}
            </TCell>
            <TCell>{ActionFragment}</TCell>
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
                    <Box>{`Available: ${ownedOptionTokenAccounts?.[0]?.amount}`}</Box>
                  </Box>
                  <Box
                    pl={formFactor === 'mobile' ? 1 : 2}
                    className={classes.column}
                  >
                    <Box>{`Size: ${normalizedUnderlyingAmount.toString()}`}</Box>
                    <Box>{`Written: ${writerTokenAccount.amount}`}</Box>
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
              {expired ? (
                <Box className={classes.errorColor}>Expired</Box>
              ) : (
                formatExpirationTimestamp(
                  option?.expirationUnixTimestamp.toNumber() ?? 0,
                )
              )}
            </TMobileCell>
            <TMobileCell
              className={clsx(
                formFactor === 'tablet' && classes.tabletFont,
                formFactor === 'mobile' && classes.mobileFont,
              )}
            >
              {lockedAmountDisplay} {underlyingAssetSymbol}
            </TMobileCell>
            <TMobileCell
              className={clsx(
                formFactor === 'tablet' && classes.tabletFont,
                formFactor === 'mobile' && classes.mobileFont,
              )}
            >
              {ActionFragment}
            </TMobileCell>
          </>
        )}
      </TableRow>
      <ClaimQuoteDialog
        dismiss={() => setClaimQuoteVisible(false)}
        optionKey={optionKey}
        numLeftToClaim={
          option
            ? quoteVaultAmount.div(option.quoteAmountPerContract).toNumber()
            : 0
        }
        quoteAssetDestKey={walletQuoteAssetKey}
        vaultBalance={quoteVaultAmount}
        visible={claimQuoteVisible}
        writerTokenAccount={writerTokenAccount}
      />
      <WrittenOptionsClaimUnderlyingDialog
        dismiss={() => setCloseWrittenOptionsVisible(false)}
        numLeftToClaim={
          option
            ? underlyingVaultAmount
                .div(option.underlyingAmountPerContract)
                .toNumber()
            : 0
        }
        optionKey={optionKey}
        underlyingAssetDestKey={walletUnderlyingAssetKey}
        vaultBalance={underlyingVaultAmount}
        visible={closeWrittenOptionsVisible}
        writerTokenAccount={writerTokenAccount}
      />
      <WrittenOptionsClosePositionPreExpiryDialog
        dismiss={() => setCloseWrittenOptionsPreExpiryVisible(false)}
        numLeftToClaim={
          option
            ? underlyingVaultAmount
                .div(option.underlyingAmountPerContract)
                .toNumber()
            : 0
        }
        optionKey={optionKey}
        optionTokenAccount={optionTokenAccount}
        underlyingAssetDestKey={walletUnderlyingAssetKey}
        vaultBalance={underlyingVaultAmount}
        visible={closeWrittenOptionsPreExpiryVisible}
        writerTokenAccount={writerTokenAccount}
      />
    </>
  );
};

export default memo(WrittenOptionRow);
