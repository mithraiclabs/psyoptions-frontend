import { CircularProgress } from '@material-ui/core'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import BigNumber from 'bignumber.js'
import React, { useCallback, useState } from 'react'
import {
  useSettleFunds,
  useSubscribeOpenOrders,
  useUnsettledFundsForMarket,
} from '../../hooks/Serum'

/**
 * UI for showing the user their unsettled funds for an single option market.
 */
export const UnsettledFunds: React.VFC<{
  qAssetDecimals: number
  qAssetSymbol: string
  serumKey: string
}> = ({ qAssetDecimals, qAssetSymbol, serumKey }) => {
  const unsettledFunds = useUnsettledFundsForMarket(serumKey)
  const _settleFunds = useSettleFunds(serumKey)
  useSubscribeOpenOrders(serumKey)
  const [loading, setLoading] = useState(false)
  const settleFunds = useCallback(async () => {
    setLoading(true)
    await _settleFunds()
    setLoading(false)
  }, [_settleFunds])

  if (
    unsettledFunds.baseFree.toNumber() <= 0 &&
    unsettledFunds.quoteFree.toNumber() <= 0
  ) {
    // no need to show the unsetlled funds when the user has none
    return null
  }

  if (loading) {
    return <CircularProgress />
  }

  const qAssetDecimalDivisor = new BigNumber(10).pow(
    new BigNumber(qAssetDecimals),
  )
  const quoteFreeNumber = new BigNumber(
    unsettledFunds.quoteFree.toNumber(),
  ).div(qAssetDecimalDivisor)

  return (
    <Box justifyContent="flex-end" textAlign="center" width="100%">
      Unsettled Funds
      <Box display="flex" flex="1" justifyContent="space-between" my={2}>
        <Box>Options: {unsettledFunds.baseFree.toString()}</Box>
        <Box>
          {qAssetSymbol}: {quoteFreeNumber.toString()}
        </Box>
      </Box>
      <Button color="primary" onClick={settleFunds} variant="outlined">
        Settle Funds
      </Button>
    </Box>
  )
}
