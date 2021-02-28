const fs = require('fs')
const BN = require('bn.js')
const argv = require('minimist')(process.argv.slice(2));
const SolWeb3 = require('@solana/web3.js')
const SPLToken = require('@solana/spl-token')

const ScriptHelpers = require('./helpers')
const NetworkInfo = require('../src/utils/networkInfo');
const SerumHelpers = require('../src/utils/serum');

const { TOKEN_PROGRAM_ID } = SPLToken
const {createInitializeMarketTx} = SerumHelpers;

const { getDexProgramKeyByNetwork, getAssetsByNetwork } = NetworkInfo;

const {
  Account,
  Connection,
  PublicKey,
  sendAndConfirmRawTransaction,
} = SolWeb3

;(async () => {
  if (!argv.baseMint || !argv.quoteMint) {
    console.log('Please include arguments --baseMint and --quoteMint\n');
    process.exit(1);
  }
  const solanaConfig = ScriptHelpers.getSolanaConfig()
  // Get the default keypair and airdrop some tokens
  const keyBuffer = fs.readFileSync(solanaConfig.keypair_path)
  const wallet = new Account(JSON.parse(keyBuffer))

  const connection = new Connection('https://devnet.solana.com')
  const splData = getAssetsByNetwork('Devnet');
  console.log('*** SPL Data = ', splData);
  const dexProgramId = getDexProgramKeyByNetwork('Devnet');
  // TODO take in the SPL addresses to create the Serum market for
  const baseMint = new PublicKey(argv.baseMint);
  const quoteMint = new PublicKey(argv.quoteMint);

  console.log(`\nLocated the Serum dex at ${dexProgramId}\n`)
  console.log(`\nCreating market for: ${baseMint.toString()} over ${quoteMint.toString()}\n`)

  const { tx1, signers1, tx2, signers2, market } = await createInitializeMarketTx(
    connection,
    wallet,
    baseMint,
    quoteMint,
    // TODO figure out what the hell baseLotSize and quoteLotSize mean
    new BN('100000'),
    new BN('100000'),
    dexProgramId,
    TOKEN_PROGRAM_ID,
  )

  console.log('*** sending TX 1')
  await tx1.partialSign(wallet);
  await sendAndConfirmRawTransaction(connection, tx1.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'recent',
    commitment: 'max'
  })

  console.log('*** sending TX 2')
  await tx2.partialSign(wallet);
  await sendAndConfirmRawTransaction(connection, tx2.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'recent',
    commitment: 'max'
  })

  console.log('*** all transactions completed', market.publicKey.toString())
})()
