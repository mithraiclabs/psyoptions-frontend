import BN from 'bn.js';
import moment from 'moment';
import { OptionMarket, OptionType } from '../types';
/**
 * Truncate a solana PublicKey string
 */
export const truncatePublicKey = (pk: string): string =>
  `${pk.slice(0, 3)}...${pk.slice(pk.length - 3, pk.length)}`;

/**
 * Take in a unix seconds timestamp and return a UTC string
 */
export const formatExpirationTimestamp = (value: number): string =>
  new Date(value * 1000).toUTCString();

/**
 * Format an option timestamp using the expiration BN
 */
export const formatOptionExpiration = (val: BN | undefined) => {
  if (!val) {
    return '';
  }
  return `${moment(val.toNumber() * 1000)
    .utc()
    .format('LLL')} UTC`;
};
/**
 * Take in unix seconds timestamp and return just the date
 */
export const formatExpirationTimestampDate = (value: number): string =>
  moment.utc(new Date(value * 1000)).format('D MMM YYYY');

/**
 * Format option to the following structure `BTC | 24 Sep 2021 | call`
 */
export const getOptionNameByMarket = (option: OptionMarket): string => {
  const type = option.uAssetSymbol.match(/^USD/)
    ? OptionType.PUT
    : OptionType.CALL;
  return `${
    type === OptionType.PUT ? option.qAssetSymbol : option.uAssetSymbol
  } | ${formatExpirationTimestampDate(option.expiration)} | ${type}`;
};
