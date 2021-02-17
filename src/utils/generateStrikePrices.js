const generateStrikePrices = (currentPrice, n) => {
  if (isNaN(n) || n === 0) return []

  const midpoint = roundTo(currentPrice, n)
  const prices = [
    ...Array(4)
      .fill('')
      .map((_, i) => midpoint + n + i * n),
    midpoint,
    ...Array(4)
      .fill('')
      .map((_, i) => midpoint - n - i * n),
  ]

  return prices.sort((a, b) => a - b).filter((n) => n >= 0)
}

const roundTo = (num, factor = 1) => {
  const quotient = num / factor
  const res = Math.round(quotient) * factor
  return res
}

export { roundTo, generateStrikePrices }
