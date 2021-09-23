import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import React, { useCallback, useState } from 'react';
import { useDecimalsForMint } from '../../../../hooks/useDecimalsForMint';
import { useExchangeWriterTokenForQuote } from '../../../../hooks/useExchangeWriterTokenForQuote';
import { OptionMarket } from '../../../../types';
import { getOptionNameByMarket } from '../../../../utils/format';
import DialogFullscreenMobile from '../../../DialogFullscreenMobile';
import { PlusMinusIntegerInput } from '../../../PlusMinusIntegerInput';

export const ClaimQuoteDialog: React.VFC<{
  dismiss: () => void;
  option: OptionMarket;
  quoteAssetDestKey: PublicKey;
  visible: boolean;
  writerTokenAccountKey: PublicKey;
}> = ({
  dismiss,
  option,
  quoteAssetDestKey,
  visible,
  writerTokenAccountKey,
}) => {
  const quoteAssetDecimals = useDecimalsForMint(option.quoteAssetMintKey);
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState(1);
  const exchangeWriterTokenForQuote = useExchangeWriterTokenForQuote(
    option,
    writerTokenAccountKey,
    quoteAssetDestKey,
  );
  const handleClaimQuote = useCallback(async () => {
    setLoading(true);
    const sizeBN = new BN(size);
    await exchangeWriterTokenForQuote(sizeBN);
    setLoading(false);
    dismiss();
  }, [dismiss, exchangeWriterTokenForQuote, size]);

  const quoteSize =
    size *
    option.quoteAmountPerContractBN.toNumber() *
    10 ** -quoteAssetDecimals;

  return (
    <DialogFullscreenMobile onClose={dismiss} maxWidth="lg" open={visible}>
      <DialogTitle>Claim {option.qAssetSymbol}</DialogTitle>
      <DialogContent>
        {getOptionNameByMarket(option)}
        <PlusMinusIntegerInput onChange={setSize} value={size} />
        <Box pt={2} style={{ fontSize: 12 }}>
          {`Burn ${size} Writer Tokens to claim ${quoteSize} ${option.qAssetSymbol}`}
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
