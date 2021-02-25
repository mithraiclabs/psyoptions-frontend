export const buildSolanaExplorerUrl = (txid, endpoint) => {
  return `https://explorer.solana.com/tx/${txid}${
    endpoint ? `?cluster=custom&customUrl=${endpoint}` : ''
  }`
}
