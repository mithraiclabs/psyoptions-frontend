import moment from 'moment';
/**
 * Truncate a solana PublicKey string
 */
const truncatePublicKey = (pk: string) =>
  `${pk.slice(0, 3)}...${pk.slice(pk.length - 3, pk.length)}`;

/**
 * Take in a unix seconds timestamp and return a UTC string
 */
const formatExpirationTimestamp = (value: number) =>
  new Date(value * 1000).toUTCString();

/**
 * Take in unix seconds timestamp and return just the date
 */
const formatExpirationTimestampDate = (value: number) =>
  moment.utc(new Date(value * 1000)).format('D MMM YYYY')

export {
  truncatePublicKey,
  formatExpirationTimestamp,
  formatExpirationTimestampDate,
};
