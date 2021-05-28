import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import Tooltip from '@material-ui/core/Tooltip'
import theme from '../../utils/theme'

const StyledBuyButton = withStyles({
  // The fakeDisabled prop is a hack/workaround
  // to make the button look disabled but still show tooltips on hover
  // Make sure to remove the onClick handler via props
  root: ({ fakeDisabled }) =>
    fakeDisabled
      ? {
          backgroundColor: theme.palette.success.dark,
          color: 'rgba(255, 255, 255, 0.3)',
          '&:hover': {
            backgroundColor: theme.palette.success.dark,
          },
        }
      : {
          backgroundColor: theme.palette.success.main,
          '&:hover': {
            backgroundColor: theme.palette.success.light,
          },
          color: theme.palette.background.main,
        },
})(Button)

const BuyButton = ({
  parsedLimitPrice,
  numberOfAsks,
  qAssetSymbol,
  orderType,
  orderCost,
  parsedOrderSize,
  qAssetBalance,
  onClick,
}) => {
  let isBuyDisabled = false
  let buyTooltipLabel = ''

  if (orderType === 'market') {
    if (numberOfAsks > 0) {
      buyTooltipLabel = `Buy ${parsedOrderSize} options at market price`
    } else {
      buyTooltipLabel = `Can't market buy because there are no asks`
      isBuyDisabled = true
    }
  } else {
    if (parsedLimitPrice.isGreaterThan(0)) {
      if (qAssetBalance >= orderCost) {
        buyTooltipLabel = `Place buy order using ${orderCost} ${qAssetSymbol}`
      } else {
        buyTooltipLabel = `Not enough ${qAssetSymbol} to place order`
        isBuyDisabled = true
      }
    } else {
      buyTooltipLabel = `Limit price can't be 0`
      isBuyDisabled = true
    }
  }

  return (
    <Tooltip title={buyTooltipLabel} placement="top">
      <StyledBuyButton
        fullWidth
        onClick={isBuyDisabled ? null : onClick}
        fakeDisabled={isBuyDisabled}
        disableRipple={isBuyDisabled}
      >
        Buy
      </StyledBuyButton>
    </Tooltip>
  )
}

export default React.memo(BuyButton)
