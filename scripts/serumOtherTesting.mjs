import {
  Account,
  Connection,
  PublicKey,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
// import { getSolanaConfig } from './helpers'
import { SerumMarket } from '../src/utils/serum.mjs'

// const fs = require('fs')

const MAINNET_DEX_PROGRAM_ID = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin'
const DEVNET_DEX_PROGRAM_ID = 'DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY'

const devnetConnection = new Connection('https://devnet.solana.com')
const mainnetConnection = new Connection('https://api.mainnet-beta.solana.com')
const mainnetProjectSerumConnection = new Connection(
  'https://solana-api.projectserum.com',
)
// const solanaConfig = getSolanaConfig()
// const keyBuffer = fs.readFileSync(solanaConfig.keypair_path)
// const wallet = new Account(JSON.parse(keyBuffer))

// console.time('findByAssets Devnet')
// const optionMint = '9ni53Y49tCxXrNbuvhSh6EombHPzoshmMTDMn47rP1pi'
// const quoteMint = '2ShyNZqKffdYKMV6Pm8Ypcxj8GQwvFiAUkfTiyxq9v42'
// const market = await SerumMarket.findByAssets(
//   devnetConnection,
//   new PublicKey(optionMint),
//   new PublicKey(quoteMint),
//   new PublicKey(DEVNET_DEX_PROGRAM_ID),
// )
// console.timeEnd('findByAssets Devnet')

console.time('findByAssets')
const rayMint = '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'
const usdtMint = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const serumMainnet = await SerumMarket.findByAssets(
  mainnetConnection,
  new PublicKey(rayMint),
  new PublicKey(usdtMint),
  new PublicKey(MAINNET_DEX_PROGRAM_ID),
)
console.timeEnd('findByAssets')

console.time('getOrderbooks')
const { bids, asks } = await serumMainnet.getOrderbook()
console.timeEnd('getOrderbooks')

console.log({ bids, asks })

process.exit(0)
