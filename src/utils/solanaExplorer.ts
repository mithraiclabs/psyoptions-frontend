/**
 * Create a Solana explorer URL for a given transaction ID and cluster name
 */
export const buildSolanaExplorerUrl = (txid: string, endpoint?: string) =>
  `https://explorer.solana.com/tx/${txid}${
    endpoint ? `?cluster=custom&customUrl=${endpoint}` : ''
  }`
