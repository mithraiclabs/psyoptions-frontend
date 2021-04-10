import { useMemo } from 'react'
import { OptionMarket } from '../types'
import useOptionsMarkets from './useOptionsMarkets'

export const useOptionMarket = ({
  uAssetSymbol,
  qAssetSymbol,
  date,
  size,
  price,
}: {
  uAssetSymbol: string
  qAssetSymbol: string
  date: string
  size: number
  price: number
}): OptionMarket | undefined => {
  const { markets } = useOptionsMarkets()

  return useMemo(
    () => markets[`${date}-${uAssetSymbol}-${qAssetSymbol}-${size}-${price}`],
    [date, markets, price, qAssetSymbol, size, uAssetSymbol],
  )
}
