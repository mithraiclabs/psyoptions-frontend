import React from 'react'
import Tooltip from '@material-ui/core/Tooltip'
import { StyledBuyButton } from './styles'

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
