import {
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import { OptionMarket } from '@mithraic-labs/psyoptions';
import BN from 'bn.js';
import React, { useCallback, useState } from 'react';
import { useInitializedMarkets } from '../../../hooks/LocalStorage';
import { useInitializeSerumMarket } from '../../../hooks/Serum/useInitializeSerumMarket';
import useAssetList from '../../../hooks/useAssetList';
import useConnection from '../../../hooks/useConnection';

export const MarketExistsDialog: React.VFC<{
  dismiss: () => void;
  optionMarket: OptionMarket | null;
}> = ({ dismiss, optionMarket }) => {
  const { dexProgramId, endpoint } = useConnection();
  const initializeSerumMarket = useInitializeSerumMarket();
  const { USDCPublicKey, USDCToken } = useAssetList();
  const [loading, setLoading] = useState(false);
  const [, setInitializedMarketMeta] = useInitializedMarkets();

  const initSerumMarket = useCallback(async () => {
    if (!optionMarket || !USDCToken) {
      return;
    }
    setLoading(true);
    // Call option always has quote asset mint set to USDC
    const tickSize = 0.01;
    // This will likely be USDC or USDT but could be other things in some cases
    const quoteLotSize = new BN(tickSize * 10 ** USDCToken?.decimals);
    const initSerumResp = await initializeSerumMarket({
      baseMintKey: optionMarket.optionMintKey,
      // This needs to be the USDC, so flip the quote asset vs underlying asset
      quoteMintKey: USDCPublicKey,
      quoteLotSize,
    });
    if (initSerumResp) {
      const [serumMarketKey] = initSerumResp;
      setInitializedMarketMeta((prevInitializedMarkets) => {
        // must search to see if there exists the same option market
        const marketsWithInitializedRemoved = prevInitializedMarkets.filter(
          (market) =>
            market.optionMarketAddress !==
            optionMarket.optionMarketKey.toString(),
        );
        return [
          ...marketsWithInitializedRemoved,
          {
            expiration: optionMarket.expiration,
            optionMarketAddress: optionMarket.optionMarketKey.toString(),
            optionContractMintAddress: optionMarket.optionMintKey.toString(),
            optionWriterTokenMintAddress:
              optionMarket.writerTokenMintKey.toString(),
            quoteAssetMint: optionMarket.quoteAssetMintKey.toString(),
            quoteAssetPoolAddress: optionMarket.quoteAssetPoolKey.toString(),
            underlyingAssetMint: optionMarket.underlyingAssetMintKey.toString(),
            underlyingAssetPoolAddress:
              optionMarket.underlyingAssetPoolKey.toString(),
            underlyingAssetPerContract:
              optionMarket.amountPerContract.toString(),
            quoteAssetPerContract:
              optionMarket.quoteAmountPerContract.toString(),
            serumMarketAddress: serumMarketKey.toString(),
            serumProgramId: dexProgramId.toString(),
            psyOptionsProgramId: endpoint.programId,
          },
        ];
      });
    }
    setLoading(false);
    dismiss();
  }, [
    USDCPublicKey,
    USDCToken,
    dexProgramId,
    dismiss,
    endpoint.programId,
    initializeSerumMarket,
    optionMarket,
    setInitializedMarketMeta,
  ]);

  return (
    <Dialog
      disableBackdropClick
      disableEscapeKeyDown
      onClose={dismiss}
      open={!!optionMarket}
    >
      <DialogTitle>Option already exists</DialogTitle>
      <DialogContent>
        <DialogContentText>
          There already exists an Option matching these parameters. You may
          initialize a Serum market for this option. It will create a market for
          Option / USDC. This is an expensive operation, so please be sure the
          right parameters are entered before you continue.
        </DialogContentText>
        <DialogActions>
          <Button onClick={dismiss} color="primary">
            Close
          </Button>
          <Button onClick={initSerumMarket} color="primary">
            {!!loading && <CircularProgress size={24} />}
            Initialize Serum Market
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};
