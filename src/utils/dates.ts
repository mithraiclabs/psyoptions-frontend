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
