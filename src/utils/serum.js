import { Market, MARKETS } from '@project-serum/serum';

/**
 * 
 * @param {Connection} connection 
 * @param {{optionMintAddress,serumMarketQuoteAssetMint,serumMarketAddress}} serumOptionMarket 
 */
export const getSerumOptionMarket = (
  connection,
  serumOptionMarket,
) => {
  const programId = MARKETS.find(({ deprecated }) => !deprecated).programId;
  return Market.load(connection, serumOptionMarket.serumMarketAddress, {}, programId);
}