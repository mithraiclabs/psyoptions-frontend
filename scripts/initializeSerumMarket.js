const fs = require('fs');
const ScriptHelpers = require('./helpers');
const SolWeb3 = require('@solana/web3.js');
const Serum = require('@project-serum/serum');
const BN = require('bn.js');
const SerumTokens = require('@project-serum/tokens');
const SplToken = require('@solana/spl-token');

const NetworkInfo = require('../src/utils/networkInfo');


const { networks, getAssetsByNetwork } = NetworkInfo;
const { AccountLayout, MintLayout, Token } = SplToken;

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

const programIds = (networkName) => {
  switch (networkName) {
    case 'Mainnet':
      return {
        dexProgramPubkey: MARKETS.find(({ deprecated }) => !deprecated).programId,
        tokenProgramPubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      }
    case 'Devnet':
      return {
        dexProgramPubkey: new PublicKey('9MVDeYQnJmN2Dt7H44Z8cob4bET2ysdNu2uFJcatDJno'),
        tokenProgramPubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      }
    case 'Testnet':
      return {
        // Looks like there was no address on the [Serum repo](https://github.com/project-serum/serum-dex#program-deployments)
        dexProgramPubkey: undefined,
        tokenProgramPubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      }
    case 'localhost': 
    const serumDexKeyBuffer = fs.readFileSync(ScriptHelpers.serumDexProgramKeypair);
    const dexProgramAccount = new Account(JSON.parse(serumDexKeyBuffer));
    const dexProgramId = dexProgramAccount.publicKey;
     return {
       dexProgramPubkey: dexProgramId,
      tokenProgramPubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
     }
    default:
      throw new Error('Unknown network name')
  }

}

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

  console.log('*** TX 1 params',{
    account: baseVault.publicKey.toString(),
    mint: baseMint.toString(),
    owner: vaultOwner.toString(),
  }, {
    account: quoteVault.publicKey.toString(),
    mint: quoteMint.toString(),
    owner: vaultOwner.toString(),
  });

  const tx1 = new Transaction();
  // Create an initialize the pool accounts to hold the base and the quote assess
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
    Token.createInitAccountInstruction(
      TokenInstructions.TOKEN_PROGRAM_ID,
      baseMint,
      baseVault.publicKey,
      vaultOwner,
    ),
    Token.createInitAccountInstruction(
      TokenInstructions.TOKEN_PROGRAM_ID,
      quoteMint,
      quoteVault.publicKey,
      vaultOwner,
    ),
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
      baseLotSize: baseLotSize,
      quoteLotSize: quoteLotSize,
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

  const connection = new Connection('https://devnet.solana.com')

  // Get the mints from the local data.
  // const splData = JSON.parse(
  //   fs.readFileSync('./src/hooks/localnetData.json')
  // )
  const splData = getAssetsByNetwork(networks, 'Devnet');
  console.log('*** SPL Data = ', splData);
  process.exit(1);
  // const serumDexKeyBuffer = fs.readFileSync(ScriptHelpers.serumDexProgramKeypair);
  // const dexProgramAccount = new Account(JSON.parse(serumDexKeyBuffer));
  // const dexProgramId = dexProgramAccount.publicKey;
  const dexProgramId = new PublicKey('9MVDeYQnJmN2Dt7H44Z8cob4bET2ysdNu2uFJcatDJno');
  console.log(`\nLocated the Serum dex at ${dexProgramId}\n`);
  console.log(`\nCreating market for\n${splData[0].tokenSymbol} ${splData[0].mintAddress}\n\n${splData[1].tokenSymbol} ${splData[1].mintAddress}\n`);

  const {tx1, signers1, tx2, signers2, market } = await initializeSerumMarket(
    connection,
    payer,
    new PublicKey(splData[0].mintAddress),
    new PublicKey(splData[1].mintAddress),
    // TODO figure out what the hell baseLotSize and quoteLotSize mean
    new BN('100000'),
    new BN('100000'),
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