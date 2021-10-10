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
import { useDecimalsForMint } from '../../../hooks/useDecimalsForMint';
import { useExchangeWriterTokenForQuote } from '../../../hooks/useExchangeWriterTokenForQuote';
import { OptionMarket, TokenAccount } from '../../../types';
import { getOptionNameByMarket } from '../../../utils/format';

export const ClaimQuoteDialog: React.VFC<{
  dismiss: () => void;
  numLeftToClaim: number;
  option: OptionMarket;
  quoteAssetDestKey: PublicKey;
  vaultBalance: BN;
  visible: boolean;
  writerTokenAccount: TokenAccount;
}> = ({
  dismiss,
  numLeftToClaim,
  option,
  quoteAssetDestKey,
  vaultBalance,
  visible,
  writerTokenAccount,
}) => {
  const quoteAssetDecimals = useDecimalsForMint(option.quoteAssetMintKey);
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState<number | null>(1);
  const exchangeWriterTokenForQuote = useExchangeWriterTokenForQuote(
    option,
    writerTokenAccount.pubKey,
    quoteAssetDestKey,
  );
  const handleClaimQuote = useCallback(async () => {
    setLoading(true);
    const sizeBN = new BN(size ?? 1);
    await exchangeWriterTokenForQuote(sizeBN);
    setLoading(false);
    dismiss();
  }, [dismiss, exchangeWriterTokenForQuote, size]);

  const quoteSize =
    (size ?? 1) *
    option.quoteAmountPerContractBN.toNumber() *
    10 ** -quoteAssetDecimals;

  const normalizedVaultBalance =
    vaultBalance.toNumber() * 10 ** -quoteAssetDecimals;
  const max = Math.min(writerTokenAccount.amount, numLeftToClaim);

  return (
    <DialogFullscreenMobile onClose={dismiss} maxWidth="lg" open={visible}>
      <DialogTitle>Claim {option.qAssetSymbol}</DialogTitle>
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
              Vault balance: {normalizedVaultBalance} {option.qAssetSymbol}
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
              {`Burn ${size ?? 0} Writer Tokens to claim ${quoteSize} ${
                option.qAssetSymbol
              }`}
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
