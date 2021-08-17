import React, { useState, useCallback } from 'react'
import TableRow from '@material-ui/core/TableRow'
import moment from 'moment'
import BigNumber from 'bignumber.js'

import useSerum from '../../hooks/useSerum'
import {
  useSubscribeOpenOrders,
  useSettleFunds,
  useUnsettledFundsForMarket,
} from '../../hooks/Serum'

import { TCell } from './UnsettledBalancesStyles'
import { UnsettledRow } from '../../types'
import TxButton from '../TxButton'

const UnsettledRow = ({
  serumMarketKey,
  type,
  expiration,
  uAssetSymbol,
  qAssetSymbol,
  strikePrice,
  contractSize,
  unsettledFunds,
  settleFunds,
  qAssetDecimals,
}) => {
  const [loading, setLoading] = useState(false)

  const handleSettleFunds = useCallback(async () => {
    setLoading(true)
    await settleFunds()
    setLoading(false)
  }, [settleFunds])

  const tokensUnsettled = new BigNumber(unsettledFunds.quoteFree.toString())
  return (
    <TableRow hover key={`tr-unsettled-${serumMarketKey}`}>
      <TCell>{type}</TCell>
      <TCell>{`${qAssetSymbol}/${uAssetSymbol}`}</TCell>
      <TCell>
        {`${moment.utc(expiration * 1000).format('LL')} 23:59:59 UTC`}
      </TCell>
      <TCell>{strikePrice}</TCell>
      <TCell>{`${contractSize} ${uAssetSymbol}`}</TCell>
      <TCell>{unsettledFunds.baseFree.toString()}</TCell>
      <TCell>
        {tokensUnsettled.dividedBy(10 ** qAssetDecimals).toString()}
        {' '}{type === 'put'? uAssetSymbol : qAssetSymbol}
      </TCell>
      <TCell align="right">
        <TxButton
          variant="outlined"
          color="primary"
          onClick={() => handleSettleFunds()}
          loading={loading}
        >
          {loading ? 'Settling funds' : 'Settle Funds'}
        </TxButton>
      </TCell>
    </TableRow>
  )
}

// Render all unsettled balances for a given market as table rows
const UnsettledBalancesRow: React.FC<UnsettledRow> = ({
  expiration,
  size: contractSize,
  type,
  qAssetSymbol,
  uAssetSymbol,
  serumMarketKey,
  strikePrice,
  qAssetDecimals,
}) => {
  const { serumMarkets } = useSerum()
  const serumMarketAddress = serumMarketKey.toString()
  const { serumMarket } = serumMarkets[serumMarketAddress] || {}
  const { settleFunds } = useSettleFunds(serumMarketAddress)
  const unsettledFunds = useUnsettledFundsForMarket(serumMarketAddress)

  useSubscribeOpenOrders(serumMarketAddress)

  if (
    !serumMarket ||
    unsettledFunds.baseFree.toNumber() <= 0 &&
    unsettledFunds.quoteFree.toNumber() <= 0
  ) {
    return null
  }

  return (
    <UnsettledRow
      serumMarketKey={serumMarketKey}
      type={type}
      expiration={expiration}
      uAssetSymbol={uAssetSymbol}
      qAssetSymbol={qAssetSymbol}
      strikePrice={strikePrice}
      contractSize={contractSize}
      unsettledFunds={unsettledFunds}
      settleFunds={settleFunds}
      qAssetDecimals={qAssetDecimals}
    />
  )
}

export default React.memo(UnsettledBalancesRow)
