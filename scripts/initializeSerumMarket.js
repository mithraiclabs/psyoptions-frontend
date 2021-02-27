const fs = require('fs');
const ScriptHelpers = require('./helpers');
const SolWeb3 = require('@solana/web3.js');
const Serum = require('@project-serum/serum');
const BN = require('bn.js');

const {
  Account,
  Connection,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} = SolWeb3;
const {
  DexInstructions,
  Market,
  MARKETS,
  TokenInstructions 
} = Serum;

/**
 * pulled from https://github.com/project-serum/serum-dex-ui/blob/c6d0da0fc645492800f48a62b3314ebb5eaf2401/src/utils/send.tsx#L473
 */
const initializeSerumMarket = async (
  connection,
  payer,
  baseMint,
  quoteMint,
  baseLotSize,
  quoteLotSize,
  dexProgramId,
) => {
  const market = new Account();
  const requestQueue = new Account();
  const eventQueue = new Account();
  const bids = new Account();
  const asks = new Account();
  const baseVault = new Account();
  const quoteVault = new Account();
  const feeRateBps = 0;
  const quoteDustThreshold = new BN(100);

  async function getVaultOwnerAndNonce() {
    const nonce = new BN(0);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const vaultOwner = await PublicKey.createProgramAddress(
          [market.publicKey.toBuffer(), nonce.toArrayLike(Buffer, 'le', 8)],
          dexProgramId,
        );
        return [vaultOwner, nonce];
      } catch (e) {
        nonce.iaddn(1);
      }
    }
  }
  const [vaultOwner, vaultSignerNonce] = await getVaultOwnerAndNonce();

  const tx1 = new Transaction();
  tx1.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: baseVault.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(165),
      space: 165,
      programId: TokenInstructions.TOKEN_PROGRAM_ID,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: quoteVault.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(165),
      space: 165,
      programId: TokenInstructions.TOKEN_PROGRAM_ID,
    }),
    TokenInstructions.initializeAccount({
      account: baseVault.publicKey,
      mint: baseMint,
      owner: vaultOwner,
    }),
    TokenInstructions.initializeAccount({
      account: quoteVault.publicKey,
      mint: quoteMint,
      owner: vaultOwner,
    }),
  );

  const tx2 = new Transaction();
  tx2.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: market.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        Market.getLayout(dexProgramId).span,
      ),
      space: Market.getLayout(dexProgramId).span,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: requestQueue.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(5120 + 12),
      space: 5120 + 12,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: eventQueue.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(262144 + 12),
      space: 262144 + 12,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: bids.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(65536 + 12),
      space: 65536 + 12,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: asks.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(65536 + 12),
      space: 65536 + 12,
      programId: dexProgramId,
    }),
    DexInstructions.initializeMarket({
      market: market.publicKey,
      requestQueue: requestQueue.publicKey,
      eventQueue: eventQueue.publicKey,
      bids: bids.publicKey,
      asks: asks.publicKey,
      baseVault: baseVault.publicKey,
      quoteVault: quoteVault.publicKey,
      baseMint: baseMint,
      quoteMint: quoteMint,
      baseLotSize: new BN(baseLotSize),
      quoteLotSize: new BN(quoteLotSize),
      feeRateBps,
      vaultSignerNonce,
      quoteDustThreshold,
      programId: dexProgramId,
    }),
  );

  return {
    tx1,
    signers1: [baseVault, quoteVault],
    tx2,
    signers2: [market, requestQueue, eventQueue, bids, asks],
    market,
  };
};



;(async () => {
  const solanaConfig = ScriptHelpers.getSolanaConfig();
  // Get the default keypair and airdrop some tokens
  const keyBuffer = fs.readFileSync(solanaConfig.keypair_path);
  const payer = new Account(JSON.parse(keyBuffer));

  const connection = new Connection('http://127.0.0.1:8899')

  // Get the mints from the local data.
  const localSPLData = JSON.parse(
    fs.readFileSync('./src/hooks/localnetData.json')
  )
  const serumDexKeyBuffer = fs.readFileSync(ScriptHelpers.serumDexProgramKeypair);
  const dexProgramAccount = new Account(JSON.parse(serumDexKeyBuffer));
  const dexProgramId = dexProgramAccount.publicKey;
  console.log(`\nLocated the Serum dex at ${dexProgramId}\n`);

  const {tx1, signers1, tx2, signers2, market } = await initializeSerumMarket(
    connection,
    payer,
    new PublicKey(localSPLData[0].mintAddress),
    new PublicKey(localSPLData[1].mintAddress),
    // TODO figure out what the hell baseLotSize and quoteLotSize mean
    10**5,
    10**5,
    dexProgramId,
  );

  console.log('*** sending TX 1');
  await sendAndConfirmTransaction(connection, tx1, [payer, ...signers1], {
    skipPreflight: false,
    commitment: 'max',
    preflightCommitment: 'recent',
  })

  console.log('*** sending TX 2');
  await sendAndConfirmTransaction(connection, tx2, [payer, ...signers2], {
    skipPreflight: false,
    commitment: 'max',
    preflightCommitment: 'recent',
  })

  console.log('*** all transactions completed', market.publicKey.toString());

})()