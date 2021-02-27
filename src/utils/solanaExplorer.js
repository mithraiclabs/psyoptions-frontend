export const buildSolanaExplorerUrl = (txid, endpoint) => `https://explorer.solana.com/tx/${txid}${
    endpoint ? `?cluster=custom&customUrl=${endpoint}` : ''
  }`
