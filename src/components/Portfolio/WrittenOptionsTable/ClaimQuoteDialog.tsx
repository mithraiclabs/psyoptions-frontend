import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Divider from '@material-ui/core/Divider';
import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import React, { useCallback, useState } from 'react';
import DialogFullscreenMobile from '../../DialogFullscreenMobile';
import { PlusMinusIntegerInput } from '../../PlusMinusIntegerInput';
import { useExchangeWriterTokenForQuote } from '../../../hooks/useExchangeWriterTokenForQuote';
import { TokenAccount } from '../../../types';
import { useRecoilValue } from 'recoil';
import { optionsMap } from '../../../recoil';
import { useNormalizeAmountOfMintBN } from '../../../hooks/useNormalizeAmountOfMintBN';
import { useTokenByMint } from '../../../hooks/useNetworkTokens';
import { useFormattedOptionName } from '../../../hooks/useFormattedOptionName';

export const ClaimQuoteDialog: React.VFC<{
  dismiss: () => void;
  numLeftToClaim: number;
  optionKey: PublicKey;
  quoteAssetDestKey: PublicKey;
  vaultBalance: BN;
  visible: boolean;
  writerTokenAccount: TokenAccount;
}> = ({
  dismiss,
  numLeftToClaim,
  optionKey,
  quoteAssetDestKey,
  vaultBalance,
  visible,
  writerTokenAccount,
}) => {
  const option = useRecoilValue(optionsMap(optionKey.toString()));
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState<number | null>(1);
  const optionName = useFormattedOptionName(optionKey);
  const optionQuoteAsset = useTokenByMint(option?.quoteAssetMint ?? '');
  const optionQuoteAssetSymbol =
    optionQuoteAsset?.symbol ?? option?.quoteAssetMint.toString() ?? '';
  const exchangeWriterTokenForQuote = useExchangeWriterTokenForQuote(
    optionKey,
    writerTokenAccount.pubKey,
    quoteAssetDestKey,
  );
  const normalzeOptionQuoteAmount = useNormalizeAmountOfMintBN(
    option?.quoteAssetMint ?? null,
  );
  const handleClaimQuote = useCallback(async () => {
    setLoading(true);
    const sizeBN = new BN(size ?? 1);
    await exchangeWriterTokenForQuote(sizeBN);
    setLoading(false);
    dismiss();
  }, [dismiss, exchangeWriterTokenForQuote, size]);

  const quoteSize = normalzeOptionQuoteAmount(
    option?.quoteAmountPerContract,
  ).multipliedBy(size ?? 1);

  const normalizedVaultBalance = normalzeOptionQuoteAmount(vaultBalance);
  const max = Math.min(writerTokenAccount.amount, numLeftToClaim);

  return (
    <DialogFullscreenMobile onClose={dismiss} maxWidth="lg" open={visible}>
      <DialogTitle>Claim {optionQuoteAssetSymbol}</DialogTitle>
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
              {optionQuoteAssetSymbol}
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
              {`Burn ${
                size ?? 0
              } Writer Tokens to claim ${quoteSize.toString()} ${optionQuoteAssetSymbol}`}
            </Box>
          </Box>
        </Box>
        <DialogActions>
          <Button onClick={dismiss} color="primary">
            Close
          </Button>
          <Button onClick={handleClaimQuote} color="primary">
            {!!loading && <CircularProgress size={24} />}
            Claim
          </Button>
        </DialogActions>
      </DialogContent>
    </DialogFullscreenMobile>
  );
};
