import React, { memo, useState, Fragment } from 'react';
import {
  Avatar,
  Box,
  Button,
  Tooltip,
  makeStyles,
  withStyles,
} from '@material-ui/core';
import clsx from 'clsx';
import { OptionType, TokenAccount } from '../../types';
import { formatExpirationTimestamp } from '../../utils/format';
import useOptionsMarkets from '../../hooks/useOptionsMarkets';
import useOwnedTokenAccounts from '../../hooks/useOwnedTokenAccounts';
import useAssetList from '../../hooks/useAssetList';
import { ClaimQuoteDialog } from './ClaimQuoteDialog';
import { WrittenOptionsClaimUnderlyingDialog } from '../WrittenOptionsClaimUnderlyingDialog';
import { WrittenOptionsClosePositionPreExpiryDialog } from '../WrittenOptionsClosePositionPreExpiryDialog';
import { useOptionVaultAmounts } from '../../hooks/useOptionVaultAmounts';

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
    fontSize: '12px',
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
}));

/**
 * Row to display the wallet's minted options
 *
 * Only closes a single expired option at a time right now.
 */
const WrittenOptionRow: React.VFC<{
  expired: boolean;
  marketKey: string;
  writerTokenAccounts: TokenAccount[];
  heldContracts: TokenAccount[];
  formFactor: 'desktop' | 'tablet' | 'mobile';
  className: string;
}> = ({
  expired,
  marketKey,
  writerTokenAccounts,
  heldContracts,
  formFactor,
  className,
}) => {
  const classes = useStyles();
  const { supportedAssets } = useAssetList();
  const { ownedTokenAccounts } = useOwnedTokenAccounts();
  const { markets } = useOptionsMarkets();
  const [claimQuoteVisible, setClaimQuoteVisible] = useState(false);
  const [closeWrittenOptionsVisible, setCloseWrittenOptionsVisible] =
    useState(false);
  const [
    closeWrittenOptionsPreExpiryVisible,
    setCloseWrittenOptionsPreExpiryVisible,
  ] = useState(false);
  const market = markets[marketKey];
  const [quoteVaultAmount, underlyingVaultAmount] = useOptionVaultAmounts(
    market.quoteAssetMintKey,
    market.quoteAssetPoolKey,
    market.underlyingAssetMintKey,
    market.underlyingAssetPoolKey,
  );
  const writerTokenAccount = writerTokenAccounts[0];
  const walletUnderlyingAssetKey =
    ownedTokenAccounts[market.uAssetMint]?.[0]?.pubKey;
  const walletQuoteAssetKey =
    ownedTokenAccounts[market.qAssetMint]?.[0]?.pubKey;
  const ownedOptionTokenAccounts =
    ownedTokenAccounts[market.optionMintKey.toString()];
  const holdsContracts = !!heldContracts.length;
  const optionTokenAccount = ownedOptionTokenAccounts[0];

  const handleClaimQuote = () => {
    setClaimQuoteVisible(true);
  };
  const showCloseWrittenOptions = () => setCloseWrittenOptionsVisible(true);
  const showCloseWrittenOptionsPreExpiry = () =>
    setCloseWrittenOptionsPreExpiryVisible(true);

  const optionType = market?.uAssetSymbol?.match(/^USD/)
    ? OptionType.PUT
    : OptionType.CALL;

  const strike =
    optionType === OptionType.PUT
      ? market?.amountPerContract &&
        market.amountPerContract
          .dividedBy(market?.quoteAmountPerContract)
          .toString()
      : market?.strike.toString(10);

  const uAssetSymbol =
    optionType === OptionType.CALL
      ? market?.uAssetSymbol
      : market?.qAssetSymbol;

  const uAssetImage = supportedAssets.find(
    (asset) =>
      asset?.tokenSymbol ===
      (optionType === OptionType.PUT
        ? market?.qAssetSymbol
        : market?.uAssetSymbol),
  )?.icon;

  const lockedAmount = writerTokenAccount.amount * parseFloat(market.size);
  const lockedAmountDisplay = `${lockedAmount}`.match(/\.(.{4,})$/)
    ? `≈${lockedAmount.toFixed(3)}`
    : lockedAmount;

  const canClose = (ownedOptionTokenAccounts?.[0]?.amount || 0) > 0;

  let ActionFragment = null;
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
                    Claim {market.uAssetSymbol}
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
                Claim {market.qAssetSymbol}
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
                  Claim {market.uAssetSymbol}
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
                Claim {market.qAssetSymbol}
              </Button>
            </Box>
          </StyledTooltip>
        )}
      </Box>
    );
  }

  return (
    <>
      <Box
        key={marketKey}
        p={1}
        className={clsx(
          classes.root,
          className,
          formFactor === 'tablet' && classes.tablet,
          formFactor === 'mobile' && classes.mobile,
        )}
      >
        <Box pr={1} pl={1} className={classes.row}>
          {formFactor === 'desktop' ? (
            <Fragment>
              <Avatar className={classes.avatar} src={uAssetImage}>
                {uAssetSymbol.slice(0, 1)}
              </Avatar>
              <Box pl={1}>{uAssetSymbol}</Box>
            </Fragment>
          ) : (
            <Fragment>
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
                  <Box>{`Available: ${ownedOptionTokenAccounts?.[0]?.amount}`}</Box>
                </Box>
                <Box
                  pl={formFactor === 'mobile' ? 1 : 2}
                  className={classes.column}
                >
                  <Box>{`Size: ${
                    optionType === 'call'
                      ? market.amountPerContract.toString()
                      : market.quoteAmountPerContract.toString()
                  }`}</Box>
                  <Box>{`Written: ${writerTokenAccount.amount}`}</Box>
                </Box>
              </Box>
            </Fragment>
          )}
        </Box>
        {formFactor === 'desktop' && (
          <Fragment>
            <Box pl={1} pr={1}>
              {optionType}
            </Box>
            <Box pr={1}>{strike}</Box>
            <Box pr={1}>{ownedOptionTokenAccounts?.[0]?.amount}</Box>
            <Box pr={1}>
              {optionType === 'call'
                ? market.amountPerContract.toString()
                : market.quoteAmountPerContract.toString()}
            </Box>
            <Box pr={1}>{writerTokenAccount.amount}</Box>
          </Fragment>
        )}
        <Box pr={1}>
          {expired ? (
            <Box className={classes.errorColor}>Expired</Box>
          ) : (
            formatExpirationTimestamp(market.expiration)
          )}
        </Box>
        <Box pr={1}>
          {lockedAmountDisplay} {market.uAssetSymbol}
        </Box>
        <Box justifySelf="center">{ActionFragment}</Box>
      </Box>
      <ClaimQuoteDialog
        dismiss={() => setClaimQuoteVisible(false)}
        option={market}
        numLeftToClaim={quoteVaultAmount
          .div(market.quoteAmountPerContractBN)
          .toNumber()}
        quoteAssetDestKey={walletQuoteAssetKey}
        vaultBalance={quoteVaultAmount}
        visible={claimQuoteVisible}
        writerTokenAccount={writerTokenAccount}
      />
      <WrittenOptionsClaimUnderlyingDialog
        dismiss={() => setCloseWrittenOptionsVisible(false)}
        numLeftToClaim={underlyingVaultAmount
          .div(market.amountPerContractBN)
          .toNumber()}
        option={market}
        underlyingAssetDestKey={walletUnderlyingAssetKey}
        vaultBalance={underlyingVaultAmount}
        visible={closeWrittenOptionsVisible}
        writerTokenAccount={writerTokenAccount}
      />
      <WrittenOptionsClosePositionPreExpiryDialog
        dismiss={() => setCloseWrittenOptionsPreExpiryVisible(false)}
        numLeftToClaim={underlyingVaultAmount
          .div(market.amountPerContractBN)
          .toNumber()}
        option={market}
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
