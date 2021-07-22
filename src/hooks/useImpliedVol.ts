import { useMemo } from 'react'
import { blackScholes } from 'black-scholes'
import { OptionType } from '../types'

const lerp = (v0, v1, t) => {
  return (1 - t) * v0 + t * v1
}

const IVSearch = (
  {
    optionPrice,
    strikePrice,
    marketPrice,
    timeToExpiry,
    riskFree,
    type,
  }: {
    optionPrice: number
    strikePrice: number
    marketPrice: number
    timeToExpiry: number
    riskFree: number
    type: OptionType
  },
  depth = 16,
) => {
  let i = 0
  let low = 0
  let high = 100
  let vol = 1
  while (i < depth) {
    const testPrice = blackScholes(
      strikePrice,
      marketPrice,
      timeToExpiry,
      vol,
      riskFree,
      type === OptionType.CALL ? OptionType.PUT : OptionType.CALL, // This has to be reversed from the buyer perspective
    )
    if (testPrice > optionPrice) {
      high = vol
      vol = lerp(low, high, 0.5)
    } else {
      low = vol
      vol = lerp(low, high, 0.5)
    }
    i += 1
  }
  return vol
}

// TODO: Do we want to pull the risk free interest rate from somewhere? Or is it safe to assume it's a constant for longer periors of time? It doesn't actually affect the computed IV that much unless the rates start getting stupidly high, like 20% or higher
const riskFree = 0.08

export const useImpliedVol = ({
  optionPrice,
  strikePrice,
  marketPrice,
  timeToExpiry,
  type,
}: {
  optionPrice: number
  strikePrice: number
  marketPrice: number
  timeToExpiry: number
  type: OptionType
}) => {
  return useMemo(() => {
    if (optionPrice && strikePrice && marketPrice && timeToExpiry) {
      return (
        IVSearch({
          optionPrice,
          strikePrice,
          marketPrice,
          timeToExpiry,
          riskFree,
          type,
        }) * 100
      )
    }
    return 0
  }, [optionPrice, strikePrice, marketPrice, timeToExpiry, type])
}
