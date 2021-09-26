import React, { useEffect, useState } from 'react';
import { Token, TOKEN_PROGRAM_ID, u64 } from '@solana/spl-token';
import Avatar from '@material-ui/core/Avatar';
import Tooltip from '@material-ui/core/Tooltip';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { withStyles, useTheme } from '@material-ui/core/styles';

import { OptionType, TokenAccount } from '../../../../types';
import { formatExpirationTimestamp } from '../../../../utils/format';
import useOptionsMarkets from '../../../../hooks/useOptionsMarkets';
import { useClosePosition } from '../../../../hooks/useClosePosition';
import useOwnedTokenAccounts from '../../../../hooks/useOwnedTokenAccounts';
import useConnection from '../../../../hooks/useConnection';
import useNotifications from '../../../../hooks/useNotifications';
import useAssetList from '../../../../hooks/useAssetList';
import TxButton from '../../../TxButton';
import { ClaimQuoteDialog } from './ClaimQuoteDialog';
import { WrittenOptionsClaimUnderlyingDialog } from '../../../WrittenOptionsClaimUnderlyingDialog';
import { WrittenOptionsClosePositionPreExpiryDialog } from '../../../WrittenOptionsClosePositionPreExpiryDialog';

const StyledTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: theme.palette.background.lighter,
    maxWidth: 370,
    fontSize: '14px',
    lineHeight: '18px',
  },
}))(Tooltip);

type WrittenOptionRowProps = {
  expired: boolean;
  marketKey: string;
  writerTokenAccounts: TokenAccount[];
  heldContracts: TokenAccount[];
};

// eslint-disable-next-line new-cap
const ZERO_U64 = new u64(0);

/**
 * Row to display the wallet's minted options
 *
 * Only closes a single expired option at a time right now.
 */
export const WrittenOptionRow = React.memo(
  ({
    expired,
    marketKey,
    writerTokenAccounts,
    heldContracts,
  }: WrittenOptionRowProps) => {
    const theme = useTheme();
    const [closeOneLoading, setCloseOneLoading] = useState(false);
    const [closeAllLoading, setCloseAllLoading] = useState(false);
    const { supportedAssets } = useAssetList();
    const { pushNotification } = useNotifications();
    const { connection } = useConnection();
    const { ownedTokenAccounts } = useOwnedTokenAccounts();
    const { markets } = useOptionsMarkets();
    const [quoteVaultAmount, setQuoteVaultAmount] = useState<u64>(ZERO_U64);
    const [underlyingVaultAmount, setUnderlyingVaultAmount] =
      useState<u64>(ZERO_U64);
    const [claimQuoteVisible, setClaimQuoteVisible] = useState(false);
    const [closeWrittenOptionsVisible, setCloseWrittenOptionsVisible] =
      useState(false);
    const [
      closeWrittenOptionsPreExpiryVisible,
      setCloseWrittenOptionsPreExpiryVisible,
    ] = useState(false);
    const market = markets[marketKey];
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

    let optionType: OptionType;
    if (market?.uAssetSymbol) {
      optionType = market?.uAssetSymbol?.match(/^USD/)
        ? OptionType.PUT
        : OptionType.CALL;
    }

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

    useEffect(() => {
      (async () => {
        try {
          const quoteToken = new Token(
            connection,
            market.quoteAssetMintKey,
            TOKEN_PROGRAM_ID,
            null,
          );
          const underlyingToken = new Token(
            connection,
            market.underlyingAssetMintKey,
            TOKEN_PROGRAM_ID,
            null,
          );
          const [quoteVaultAccount, underlyingVaultAccount] = await Promise.all(
            [
              quoteToken.getAccountInfo(market.quoteAssetPoolKey),
              underlyingToken.getAccountInfo(market.underlyingAssetPoolKey),
            ],
          );
          setQuoteVaultAmount(quoteVaultAccount.amount);
          setUnderlyingVaultAmount(underlyingVaultAccount.amount);
        } catch (err) {
          pushNotification({
            severity: 'error',
            message: `${err}`,
          });
        }
      })();
    }, [
      connection,
      market.qAssetMint,
      market.quoteAssetMintKey,
      market.quoteAssetPoolKey,
      market.underlyingAssetMintKey,
      market.underlyingAssetPoolKey,
      pushNotification,
    ]);

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
                    The written option has expired, closing will return the
                    locked underlying asset
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
                  Some option contracts have been exercised. Burn the writer
                  token to claim the quote asset and forfeit the locked
                  underlying asset
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
                  Some option contracts have been exercised. Burn the writer
                  token to claim the quote asset and forfeit the locked
                  underlying asset
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
          display="flex"
          flexDirection="row"
          alignItems="center"
          p={1}
        >
          <Box
            p={1}
            pl={2}
            width="12%"
            display="flex"
            flexDirection="row"
            alignItems="center"
          >
            <Avatar style={{ width: 24, height: 24 }} src={uAssetImage}>
              {uAssetSymbol.slice(0, 1)}
            </Avatar>
            <Box pl={1}>{uAssetSymbol}</Box>
          </Box>
          <Box p={1} width="8%">
            {optionType}
          </Box>
          <Box p={1} width="10%">
            {strike}
          </Box>
          <Box p={1} width="10%">
            {lockedAmountDisplay} {market.uAssetSymbol}
          </Box>
          <Box p={1} width="10%">
            {optionType === 'call'
              ? market.amountPerContract.toString()
              : market.quoteAmountPerContract.toString()}
          </Box>
          <Box p={1} width="10%">
            {writerTokenAccount.amount}
          </Box>
          <Box p={1} width="10%">
            {ownedOptionTokenAccounts?.[0]?.amount}
          </Box>
          <Box p={1} width="15%">
            {expired ? (
              <Box color={theme.palette.error.main}>Expired</Box>
            ) : (
              formatExpirationTimestamp(market.expiration)
            )}
          </Box>
          <Box width="15%">{ActionFragment}</Box>
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
  },
);
