const truncatePublicKey = (pk) => {
  return `${pk.slice(0, 3)}...${pk.slice(pk.length - 3, pk.length)}`
}

export { truncatePublicKey }
