import moment from 'moment'

// TODO: we need to populate this list from the blockchain by finding all SPL tokens minted by the intialize market program and unpack the byte data.
// Alternatively if that's too hard we can have an API that returns the list of markets that we manually create (or use a script to create) and put into a database.
const markets = {
  20210301: {
    // This key should always be UA-QA order
    // Right now we are relying on having the correct symbol mapped to the address in "useAssetList.js"
    // In the future, if we ever allow custom SPL tokens, we might want to change this to two account addresses, instead of the symbols
    'SOL-USDT': {
      uAssetAaccount: 'address...', // What is this when the UA is solana itself?
      qAssetAccount: 'address...',
      sizes: {
        1: {
          // Strike prices
          '8.00': 'address...',
          '8.50': 'address...',
          '9.00': 'address...',
          '9.50': 'address...',
          '10.00': 'address...',
          '10.50': 'address...',
          '11.00': 'address...',
        },
        100: {
          // Strike prices
          '8.00': 'address...',
          '8.50': 'address...',
          '9.00': 'address...',
          '9.50': 'address...',
          '10.00': 'address...',
          '10.50': 'address...',
          '11.00': 'address...',
        },
      },
    },
  },
  20210307: {
    // This key can always be UA-QA order
    'SOL-USDT': {
      uAssetAaccount: 'address...',
      qAssetAccount: 'address...',
      sizes: {
        1: {
          // Strike prices
          '8.00': 'address...',
          '8.50': 'address...',
          '9.00': 'address...',
          '9.50': 'address...',
          '10.00': 'address...',
          '10.50': 'address...',
          '11.00': 'address...',
        },
        100: {
          // Strike prices
          '8.00': 'address...',
          '8.50': 'address...',
          '9.00': 'address...',
          '9.50': 'address...',
          '10.00': 'address...',
          '10.50': 'address...',
          '11.00': 'address...',
        },
      },
    },
  },
}

const useOptionsMarkets = () => {
  const loaded = true // This will do something once we're pulling from an external list

  const marketExists = ({ uAssetSymbol, qAssetSymbol, date, size, price }) => {
    const pair = `${uAssetSymbol}-${qAssetSymbol}`
    return {
      date: !!markets[date],
      pair: !!markets[date]?.[pair],
      size: !!markets[date]?.[pair]?.sizes?.[size],
      price: !!markets[date]?.[pair]?.sizes?.[size]?.[price],
    }
  }

  const getStrikePrices = ({ uAssetSymbol, qAssetSymbol, date, size }) => {
    const pair = `${uAssetSymbol}-${qAssetSymbol}`
    return Object.keys(markets[date]?.[pair]?.sizes?.[size] || {})
  }

  const getMarketAddress = ({
    uAssetSymbol,
    qAssetSymbol,
    date,
    size,
    price,
  }) => {
    const pair = `${uAssetSymbol}-${qAssetSymbol}`
    return markets[date]?.[pair]?.sizes?.[size]?.[price]
  }

  const getDates = () => {
    return Object.keys(markets)
  }

  return {
    loaded,
    markets,
    marketExists,
    getMarketAddress,
    getStrikePrices,
    getDates,
  }
}

export default useOptionsMarkets
