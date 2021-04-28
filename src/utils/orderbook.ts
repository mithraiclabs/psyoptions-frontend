import { OrderbookData } from '../context/SerumOrderbookContext'

export const getPriceFromSerumOrderbook = (
  orderbook: OrderbookData,
): number | null => {
  const highestBid = orderbook?.bids[0]?.price
  const lowestAsk = orderbook?.asks[0]?.price
  if (!highestBid || !lowestAsk) {
    return null
  }

  return (lowestAsk + highestBid) / 2
}
