import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Divider from '@material-ui/core/Divider';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import React, { useCallback, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { useCloseWrittenOptionPostExpiration } from '../hooks/useCloseWrittenOptionPostExpiration';
import { useFormattedOptionName } from '../hooks/useFormattedOptionName';
import { useTokenByMint } from '../hooks/useNetworkTokens';
import { useNormalizeAmountOfMintBN } from '../hooks/useNormalizeAmountOfMintBN';
import { optionsMap } from '../recoil';
import { TokenAccount } from '../types';
import DialogFullscreenMobile from './DialogFullscreenMobile';
import { PlusMinusIntegerInput } from './PlusMinusIntegerInput';

export const WrittenOptionsClaimUnderlyingDialog: React.VFC<{
  dismiss: () => void;
  numLeftToClaim: number;
  optionKey: PublicKey;
  underlyingAssetDestKey: PublicKey;
  vaultBalance: BN;
  visible: boolean;
  writerTokenAccount: TokenAccount;
}> = ({
  dismiss,
  numLeftToClaim,
  optionKey,
  underlyingAssetDestKey,
  vaultBalance,
  visible,
  writerTokenAccount,
}) => {
  const option = useRecoilValue(optionsMap(optionKey.toString()));
  const optionName = useFormattedOptionName(optionKey);
  const optionUnderlyingAsset = useTokenByMint(
    option?.underlyingAssetMint ?? '',
  );
  const optionUnderlyingAssetSymbol =
    optionUnderlyingAsset?.symbol ??
    option?.underlyingAssetMint.toString() ??
    '';
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState<number | null>(1);
  const normalizeOptionUnderlyingAmt = useNormalizeAmountOfMintBN(
    option?.underlyingAssetMint,
  );
  const closeOptionPostExpiration = useCloseWrittenOptionPostExpiration(
    optionKey,
    underlyingAssetDestKey,
    writerTokenAccount.pubKey,
  );
  const handleClaimUnderlying = useCallback(async () => {
    setLoading(true);
    await closeOptionPostExpiration(size ?? 1);
    setLoading(false);
    dismiss();
  }, [closeOptionPostExpiration, dismiss, size]);

  const underlyingSize = normalizeOptionUnderlyingAmt(
    option?.underlyingAmountPerContract,
  ).multipliedBy(size ?? 0);

  const normalizedVaultBalance = normalizeOptionUnderlyingAmt(vaultBalance);
  const max = Math.min(writerTokenAccount.amount, numLeftToClaim);

  return (
    <DialogFullscreenMobile onClose={dismiss} maxWidth="lg" open={visible}>
      <DialogTitle>Claim {optionUnderlyingAssetSymbol}</DialogTitle>
      <DialogContent>
        <Box
          display="flex"
          justifyContent="space-between"
          flexDirection={['column', 'column', 'row']}
          width={['100%', '100%', '680px']}
        >
          <Box flexDirection="column" width={['100%', '100%', '50%']}>
            {optionName}
            <Box pt={1}>
              Vault balance: {normalizedVaultBalance.toString()}{' '}
              {optionUnderlyingAssetSymbol}
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
              {`Burn ${size} Writer Tokens to claim ${underlyingSize} ${optionUnderlyingAssetSymbol}`}
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
