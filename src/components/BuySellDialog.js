import {
  Box,
  // Paper,
  // FormControlLabel,
  // Switch,
  Dialog,
  FilledInput,
  withStyles,
  Button,
} from '@material-ui/core'
import React, { useState } from 'react'

import theme from '../utils/theme'

const StyledFilledInput = withStyles({
  root: {
    borderRadius: 0,
    width: '100%',
    minWidth: '100px',
  },
  input: {
    padding: '8px 12px !important',
  },
})(FilledInput)

const PlusMinusButton = withStyles({
  root: {
    borderRadius: 0,
    minWidth: '38px',
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    marginLeft: '2px',
    fontWeight: 700,
    fontSize: '24px',
    lineHeight: '24px',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
    },
  },
})(Button)

const BuySellDialog = ({
  open,
  onClose,
  heading,
  amountPerContract,
  uAssetSymbol,
  qAssetSymbol,
  strike,
  round,
  precision,
}) => {
  const [orderSize, setOrderSize] = useState(1)
  const [limitPrice, setLimitPrice] = useState('0') // TODO -- default to lowest ask

  const parsedOrderSize =
    Number.isNaN(orderSize) || orderSize < 1 ? 1 : parseInt(orderSize, 10)

  const collateralRequired =
    amountPerContract &&
    amountPerContract.multipliedBy(parsedOrderSize).toString()

  const contractsWritten = 0
  const openPositionSize = 0

  const formatStrike = (sp) => {
    if (!sp) return '—'
    return round ? sp.toFixed(precision) : sp.toString(10)
  }

  const handleChangeSize = (e) => setOrderSize(e.target.value)

  return (
    <Dialog open={open} onClose={onClose}>
      <Box py={1} px={2} width="650px" maxWidth="100%">
        <Box p={1}>
          <h2 style={{ margin: '0' }}>{heading}</h2>
        </Box>
        <Box flexDirection={['column', 'column', 'row']} display="flex" pb={1}>
          <Box p={1} width={['100%', '100%', '50%']}>
            <Box pt={1}>
              Strike: {formatStrike(strike)} {uAssetSymbol}/{qAssetSymbol}
            </Box>
            <Box pt={1}>Open Position: {openPositionSize}</Box>
            <Box py={1}>
              Written: {contractsWritten} (
              {contractsWritten * amountPerContract} {uAssetSymbol} locked)
            </Box>
            <Box py={1}>
              Order Quantity:
              <Box pt={1} display="flex" flexDirection="row">
                <StyledFilledInput
                  value={`${orderSize}`}
                  type="number"
                  onChange={handleChangeSize}
                  onBlur={() => {
                    if (orderSize !== parsedOrderSize) {
                      setOrderSize(parsedOrderSize)
                    }
                  }}
                />
                <PlusMinusButton
                  onClick={() => setOrderSize(Math.max(1, parsedOrderSize - 1))}
                >
                  -
                </PlusMinusButton>
                <PlusMinusButton
                  onClick={() => setOrderSize(parsedOrderSize + 1)}
                >
                  +
                </PlusMinusButton>
              </Box>
              <Box pt={1} style={{ fontSize: '10px' }}>
                Collateral required to mint: {collateralRequired} {uAssetSymbol}
              </Box>
              <Box pt={1} style={{ fontSize: '10px' }}>
                Available in wallet: TODO {uAssetSymbol}
              </Box>
            </Box>
            <Box py={1}>
              Order Type:
              <Box pt={1}></Box>
            </Box>
            <Box py={1}>
              Limit Price ({qAssetSymbol}):
              <Box pt={1}>
                <StyledFilledInput value={`${limitPrice}`} />
              </Box>
            </Box>
          </Box>
          <Box p={1} width={['100%', '100%', '50%']}></Box>
        </Box>
      </Box>
    </Dialog>
  )
}

export default BuySellDialog
