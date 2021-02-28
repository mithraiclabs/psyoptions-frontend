const truncatePublicKey = (pk) =>
  `${pk.slice(0, 3)}...${pk.slice(pk.length - 3, pk.length)}`

const formatExpirationTimestamp = (value) =>
  new Date(value * 1000).toUTCString()

export { formatExpirationTimestamp, truncatePublicKey }
