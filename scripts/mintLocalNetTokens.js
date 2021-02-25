const SPLToken = require('@solana/spl-token')
const SolWeb3 = require('@solana/web3.js')
const fs = require('fs')

const { Token, TOKEN_PROGRAM_ID } = SPLToken
const {
  Account,
  Connection,
} = SolWeb3

;(async () => {
  const connection = new Connection('http://127.0.0.1:8899')
  const keyPairFilePath = process.argv[2];
  const walletAddress = process.argv[3];
  let payer;
  if (!keyPairFilePath) {
    throw new Error('Missing keypair file argument');
  }
  const keyBuffer = fs.readFileSync(keyPairFilePath);
  payer = new Account(JSON.parse(keyBuffer));

  const localSPLData = JSON.parse(fs.readFileSync('./src/hooks/localnetData.json'));

  // For each SPL Token created, create a new account owned by payer and mint 1,000 tokens
  localSPLData.forEach(async (splData, index) => {
    const token = new Token(connection, splData.mintAddress, TOKEN_PROGRAM_ID, payer);
    const newTokenAccount = await token.createAccount(walletAddress || payer);
    // The tokens created by the seedLocalNet have 8 decimals
    token.mintTo(newTokenAccount, payer, [], 1000 * 10**8);
    console.log(`** created account ${newTokenAccount} with 1,000 ${splData.mintAddress} tokens\n`);
  });
})();
