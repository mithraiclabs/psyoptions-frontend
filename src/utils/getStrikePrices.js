import BigNumber from 'bignumber.js'

const baseIntervals = [
  new BigNumber(1),
  new BigNumber(1.25),
  new BigNumber(1.5),
  new BigNumber(1.75),
  new BigNumber(2),
  new BigNumber(3),
  new BigNumber(4),
  new BigNumber(5),
  new BigNumber(6),
  new BigNumber(7),
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
 * @returns BigNumber
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
