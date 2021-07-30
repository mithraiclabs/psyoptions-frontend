import moment from 'moment'

const subtractDays = [2, 3, 4, 5, 6, 0, 1]

/**
 * Calculate and return an array of the last Friday for every month
 */
export const getLastFridayOfMonths = (n = 10) =>
  Array(n)
    .fill(0)
    .map((_, i) => {
      const lastDay = moment
        .utc()
        .startOf('month')
        .add(i, 'month')
        .endOf('month')
      const lastFriday = lastDay.subtract(subtractDays[lastDay.day()], 'day')
      return lastFriday
    })
    .filter((date) => date.isSameOrAfter(moment.utc()))

/**
 * Return the last friday for the next 2 months, and the end of the current year (or next year if included in the 2 months)
 */
export const getSimpleUIExpirations = () => {
  const today = moment.utc()

  const endOfYear = moment
    .utc()
    .add(today.month() > 10 ? 1 : 0, 'year') // If after october, this will be end of next year
    .endOf('year')

  const lastFridayOfYear = endOfYear.subtract(
    subtractDays[endOfYear.day()],
    'day',
  )

  return [
    ...Array(2)
      .fill(0)
      .map((_, i) => {
        const lastDay = moment
          .utc()
          .startOf('month')
          .add(i, 'month')
          .endOf('month')
        const lastFriday = lastDay.subtract(subtractDays[lastDay.day()], 'day')
        return lastFriday
      })
      .filter((date) => date.isSameOrAfter(moment.utc())),
    lastFridayOfYear,
  ]
}
