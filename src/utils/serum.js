import { Market, MARKETS } from '@project-serum/serum';

/**
 * 
 * @param {Connection} connection 
 * @param {PublicKey} marketAddress 
 */
export const getSerumMarket = async (
  connection,
  marketAddress,
) => {
  const programId = MARKETS.find(({ deprecated }) => !deprecated).programId;
  return Market.load(connection, marketAddress, {}, programId);
}