import BigNumber from 'bignumber.js'

// TODO: make the "half intervals", aka 4.5, 5.5, 6.5, 7.5 programmatically generated for a few strikes close to market price
// Would be done in the getStrikePrices function
// For now, they're hard coded to match Deribit's BTC options chain

const baseIntervals = [
  new BigNumber(1),
  new BigNumber(1.2),
  new BigNumber(1.4),
  new BigNumber(1.6),
  new BigNumber(1.8),
  new BigNumber(2),
  new BigNumber(3),
  new BigNumber(4),
  new BigNumber(4.5),
  new BigNumber(5),
  new BigNumber(5.5),
  new BigNumber(6),
  new BigNumber(6.5),
  new BigNumber(7),
  new BigNumber(7.5),
  new BigNumber(8),
  new BigNumber(9),
]

const intervals = [
  ...baseIntervals.map((i) => i.multipliedBy(0.00001)),
  ...baseIntervals.map((i) => i.multipliedBy(0.0001)),
  ...baseIntervals.map((i) => i.multipliedBy(0.001)),
  ...baseIntervals.map((i) => i.multipliedBy(0.01)),
  ...baseIntervals.map((i) => i.multipliedBy(0.1)),
  ...baseIntervals,
  ...baseIntervals.map((i) => i.multipliedBy(10)),
  ...baseIntervals.map((i) => i.multipliedBy(100)),
  ...baseIntervals.map((i) => i.multipliedBy(1000)),
  ...baseIntervals.map((i) => i.multipliedBy(10000)),
  ...baseIntervals.map((i) => i.multipliedBy(100000)),
]

/**
 * @returns BigNumber[]
 */
const getStrikePrices = (markPrice, rangeAbove = 4, rangeBelow = 4) => {
  let midpointRoundedUp = new BigNumber(0)
  let i = 0
  while (midpointRoundedUp.isLessThan(markPrice) && i < intervals.length) {
    midpointRoundedUp = intervals[i]
    i += 1
  }

  if (i > 0) i -= 1

  return [
    ...intervals.slice(i - rangeBelow, i),
    ...intervals.slice(i, i + rangeAbove),
  ]
}

export { getStrikePrices, intervals }
