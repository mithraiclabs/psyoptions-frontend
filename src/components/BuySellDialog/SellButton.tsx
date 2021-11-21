import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import BigNumber from 'bignumber.js';

import { StyledSellButton } from './styles';
import { useNormalizedContractSize } from '../../hooks/useNormalizedContractSize';

const SellButton: React.VFC<{
  parsedLimitPrice: BigNumber;
  openPositionSize: number;
  numberOfBids: number;
  uAssetSymbol: string;
  uAssetBalance: number;
  orderType: string;
  parsedOrderSize: number;
  onClick: () => Promise<void>;
}> = ({
  parsedLimitPrice,
  openPositionSize,
  numberOfBids,
  uAssetSymbol,
  uAssetBalance,
  orderType,
  parsedOrderSize,
  onClick,
}) => {
  const sizeOfContract = useNormalizedContractSize();
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
        openPositionSize + uAssetBalance / sizeOfContract >=
        parsedOrderSize
      ) {
        mintSellTooltipLabel = `Place ${orderType} sell order using: ${
          openPositionSize > 0
            ? `${openPositionSize} owned option${
                openPositionSize > 1 && parsedOrderSize > 1 ? 's' : ''
              } and `
            : ''
        }${
          (parsedOrderSize - openPositionSize) * sizeOfContract
        } ${uAssetSymbol}`;
      } else {
        mintSellTooltipLabel = `Not enough ${uAssetSymbol} to place order`;
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
