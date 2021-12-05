import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import BigNumber from 'bignumber.js';

import { StyledSellButton } from './styles';
import { PublicKey } from '@solana/web3.js';
import { useRecoilValue } from 'recoil';
import { optionsMap } from '../../recoil';
import { useNormalizeAmountOfMintBN } from '../../hooks/useNormalizeAmountOfMintBN';
import { useOptionAssetValues } from '../../hooks/useOptionAssetValues';

const SellButton: React.VFC<{
  parsedLimitPrice: BigNumber;
  openPositionSize: number;
  numberOfBids: number;
  optionUnderlyingBalance: number;
  orderType: string;
  optionKey: PublicKey;
  parsedOrderSize: number;
  onClick: () => Promise<void>;
}> = ({
  parsedLimitPrice,
  openPositionSize,
  numberOfBids,
  optionUnderlyingBalance,
  optionKey,
  orderType,
  parsedOrderSize,
  onClick,
}) => {
  const option = useRecoilValue(optionsMap(optionKey.toString()));
  const [optionUnderlyingAsset] = useOptionAssetValues(optionKey);
  const optionUnderlyingAssetSymbol =
    optionUnderlyingAsset?.symbol ??
    option?.underlyingAssetMint.toString() ??
    '';
  const normalizeUnderlyingAmountBN = useNormalizeAmountOfMintBN(
    option?.underlyingAssetMint ?? null,
  );
  const optionUnderlyingAmount = normalizeUnderlyingAmountBN(
    option?.underlyingAmountPerContract,
  );
  let isSellDisabled = false;
  let mintSellTooltipLabel = '';

  if (orderType === 'market' && numberOfBids === 0) {
    mintSellTooltipLabel = `Can't market sell because there are no bids`;
    isSellDisabled = true;
  } else if (orderType === 'limit' && parsedLimitPrice.isLessThanOrEqualTo(0)) {
    mintSellTooltipLabel = `Limit price can't be 0`;
    isSellDisabled = true;
  } else {
    if (openPositionSize >= parsedOrderSize) {
      mintSellTooltipLabel = `Place ${orderType} sell order using: ${parsedOrderSize} owned option${
        parsedOrderSize > 1 ? 's' : ''
      }`;
    } else {
      if (
        openPositionSize +
          optionUnderlyingBalance / optionUnderlyingAmount.toNumber() >=
        parsedOrderSize
      ) {
        mintSellTooltipLabel = `Place ${orderType} sell order using: ${
          openPositionSize > 0
            ? `${openPositionSize} owned option${
                openPositionSize > 1 && parsedOrderSize > 1 ? 's' : ''
              } and `
            : ''
        }${
          (parsedOrderSize - openPositionSize) *
          optionUnderlyingAmount.toNumber()
        } ${optionUnderlyingAssetSymbol}`;
      } else {
        mintSellTooltipLabel = `Not enough ${optionUnderlyingAssetSymbol} to place order`;
        isSellDisabled = true;
      }
    }
  }

  return (
    <Tooltip title={mintSellTooltipLabel} placement="top">
      <StyledSellButton
        fullWidth
        onClick={isSellDisabled ? undefined : onClick}
        fakeDisabled={isSellDisabled}
        disableRipple={isSellDisabled}
      >
        {openPositionSize >= parsedOrderSize ? 'Sell' : 'Mint/Sell'}
      </StyledSellButton>
    </Tooltip>
  );
};

export default React.memo(SellButton);
