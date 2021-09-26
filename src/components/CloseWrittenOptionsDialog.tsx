import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Divider from '@material-ui/core/Divider';
import { u64 } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import React, { useCallback, useState } from 'react';
import { useCloseWrittenOptionPostExpiration } from '../hooks/useCloseWrittenOptionPostExpiration';
import { useDecimalsForMint } from '../hooks/useDecimalsForMint';
import { OptionMarket, TokenAccount } from '../types';
import { getOptionNameByMarket } from '../utils/format';
import DialogFullscreenMobile from './DialogFullscreenMobile';
import { PlusMinusIntegerInput } from './PlusMinusIntegerInput';

export const CloseWrittenOptionsDialog: React.VFC<{
  dismiss: () => void;
  numLeftToClaim: number;
  option: OptionMarket;
  underlyingAssetDestKey: PublicKey;
  vaultBalance: u64;
  visible: boolean;
  writerTokenAccount: TokenAccount;
}> = ({
  dismiss,
  numLeftToClaim,
  option,
  underlyingAssetDestKey,
  vaultBalance,
  visible,
  writerTokenAccount,
}) => {
  const underlyingAssetDecimals = useDecimalsForMint(
    option.underlyingAssetMintKey,
  );
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState<number | null>(1);
  const closeOptionPostExpiration = useCloseWrittenOptionPostExpiration(
    option,
    underlyingAssetDestKey,
    writerTokenAccount.pubKey,
  );
  const handleClaimUnderlying = useCallback(async () => {
    setLoading(true);
    await closeOptionPostExpiration(size ?? 1);
    setLoading(false);
    dismiss();
  }, [closeOptionPostExpiration, dismiss, size]);

  const underlyingSize =
    (size ?? 0) *
    option.amountPerContractBN.toNumber() *
    10 ** -underlyingAssetDecimals;

  const normalizedVaultBalance =
    vaultBalance.toNumber() * 10 ** -underlyingAssetDecimals;
  const max = Math.min(writerTokenAccount.amount, numLeftToClaim);

  return (
    <DialogFullscreenMobile onClose={dismiss} maxWidth="lg" open={visible}>
      <DialogTitle>Claim {option.uAssetSymbol}</DialogTitle>
      <DialogContent>
        <Box
          display="flex"
          justifyContent="space-between"
          flexDirection={['column', 'column', 'row']}
          width={['100%', '100%', '680px']}
        >
          <Box flexDirection="column" width={['100%', '100%', '50%']}>
            {getOptionNameByMarket(option)}
            <Box pt={1}>
              Vault balance: {normalizedVaultBalance} {option.uAssetSymbol}
            </Box>
            <Box py={1}>Writer Tokens held: {writerTokenAccount.amount}</Box>
            <Divider />
            <Box pt={1}>Max redeemable: {max}</Box>
          </Box>
          <Box flexDirection="column" width={['100%', '100%', '50%']}>
            <PlusMinusIntegerInput
              max={max}
              min={1}
              onChange={setSize}
              value={size}
            />
            <Box pt={2} style={{ fontSize: 12 }}>
              {`Burn ${size} Writer Tokens to claim ${underlyingSize} ${option.uAssetSymbol}`}
            </Box>
          </Box>
        </Box>
        <DialogActions>
          <Button onClick={dismiss} color="primary">
            Close
          </Button>
          <Button onClick={handleClaimUnderlying} color="primary">
            {!!loading && <CircularProgress size={24} />}
            Claim
          </Button>
        </DialogActions>
      </DialogContent>
    </DialogFullscreenMobile>
  );
};
