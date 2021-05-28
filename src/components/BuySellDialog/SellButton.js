import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import Tooltip from '@material-ui/core/Tooltip'
import theme from '../../utils/theme'

const StyledSellButton = withStyles({
  // The fakeDisabled prop is a hack/workaround
  // to make the button look disabled but still show tooltips on hover
  // Make sure to remove the onClick handler via props
  root: ({ fakeDisabled }) =>
    fakeDisabled
      ? {
          backgroundColor: theme.palette.error.dark,
          color: 'rgba(255, 255, 255, 0.3)',
          '&:hover': {
            backgroundColor: theme.palette.error.dark,
          },
        }
      : {
          backgroundColor: theme.palette.error.main,
          '&:hover': {
            backgroundColor: theme.palette.error.light,
          },
        },
})(Button)

const SellButton = ({
  amountPerContract,
  parsedLimitPrice,
  openPositionSize,
  numberOfBids,
  uAssetSymbol,
  uAssetBalance,
  orderType,
  parsedOrderSize,
  onClick,
}) => {
  let isSellDisabled = false
  let mintSellTooltipLabel = ''

  if (orderType === 'market' && numberOfBids === 0) {
    mintSellTooltipLabel = `Can't market sell because there are no bids`
    isSellDisabled = true
  } else if (orderType === 'limit' && parsedLimitPrice.isLessThanOrEqualTo(0)) {
    mintSellTooltipLabel = `Limit price can't be 0`
    isSellDisabled = true
  } else {
    if (openPositionSize >= parsedOrderSize) {
      mintSellTooltipLabel = `Place ${orderType} sell order using: ${parsedOrderSize} owned option${
        parsedOrderSize > 1 ? 's' : ''
      }`
    } else {
      if (
        openPositionSize + uAssetBalance / amountPerContract.toNumber() >=
        parsedOrderSize
      ) {
        mintSellTooltipLabel = `Place ${orderType} sell order using: ${
          openPositionSize > 0
            ? `${openPositionSize} owned option${
                openPositionSize > 1 && parsedOrderSize > 1 ? 's' : ''
              } and `
            : ''
        }${
          (parsedOrderSize - openPositionSize) * amountPerContract.toNumber()
        } ${uAssetSymbol}`
      } else {
        mintSellTooltipLabel = `Not enough ${uAssetSymbol} to place order`
        isSellDisabled = true
      }
    }
  }

  return (
    <Tooltip title={mintSellTooltipLabel} placement="top">
      <StyledSellButton
        fullWidth
        onClick={isSellDisabled ? null : onClick}
        fakeDisabled={isSellDisabled}
        disableRipple={isSellDisabled}
      >
        {openPositionSize >= parsedOrderSize ? 'Sell' : 'Mint/Sell'}
      </StyledSellButton>
    </Tooltip>
  )
}

export default React.memo(SellButton)
