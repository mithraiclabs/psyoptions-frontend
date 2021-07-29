import BN from 'bn.js'
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmRawTransaction,
} from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

import {
  getDexProgramKeyByNetwork,
  getAssetsByNetwork,
} from '../src/utils/networkInfo'
import { createInitializeMarketTx } from '../src/utils/serum'
import { ClusterName } from 'src/types'
const fs = require('fs')
const argv = require('minimist')(process.argv.slice(2))
const ScriptHelpers = require('./helpers')

;(async () => {
  if (!argv.baseMint || !argv.quoteMint) {
    console.log('Please include arguments --baseMint and --quoteMint\n')
    process.exit(1)
  }
  const solanaConfig = ScriptHelpers.getSolanaConfig()
  // Get the default keypair and airdrop some tokens
  const keyBuffer = fs.readFileSync(solanaConfig.keypair_path)
  const wallet = new Keypair(JSON.parse(keyBuffer))

  const connection = new Connection('https://devnet.solana.com')
  const splData = getAssetsByNetwork(ClusterName.devnet)
  console.log('*** SPL Data = ', splData)
  const dexProgramId = getDexProgramKeyByNetwork(ClusterName.devnet)
  // TODO take in the SPL addresses to create the Serum market for
  const baseMint = new PublicKey(argv.baseMint)
  const quoteMint = new PublicKey(argv.quoteMint)

  console.log(`\nLocated the Serum dex at ${dexProgramId}\n`)
  console.log(
    `\nCreating market for: ${baseMint.toString()} over ${quoteMint.toString()}\n`,
  )

  const { tx1, signers1, tx2, signers2, market } =
    await createInitializeMarketTx({
      connection,
      payer: wallet,
      baseMint,
      quoteMint,
      // TODO figure out what the hell baseLotSize and quoteLotSize mean
      baseLotSize: new BN('100000'),
      quoteLotSize: new BN('100000'),
      dexProgramId,
    })

  console.log('*** sending TX 1')
  await tx1.partialSign(wallet)
  await sendAndConfirmRawTransaction(connection, tx1.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'recent',
    commitment: 'max',
  })

  console.log('*** sending TX 2')
  await tx2.partialSign(wallet)
  await sendAndConfirmRawTransaction(connection, tx2.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'recent',
    commitment: 'max',
  })

  console.log('*** all transactions completed', market.publicKey.toString())
})()
