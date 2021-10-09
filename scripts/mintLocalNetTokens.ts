import { Token, TOKEN_PROGRAM_ID, u64 } from '@solana/spl-token';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
const fs = require('fs');

(async () => {
  const connection = new Connection('http://127.0.0.1:8899');
  const keyPairFilePath = process.argv[2];
  const walletAddress = process.argv[3];
  let payer;
  if (!keyPairFilePath) {
    throw new Error('Missing keypair file argument');
  }
  const keyBuffer = fs.readFileSync(keyPairFilePath);
  payer = Keypair.fromSecretKey(Buffer.from(JSON.parse(keyBuffer)));

  const localSPLData = JSON.parse(fs.readFileSync('./tmp/localnetData.json'));

  // For each SPL Token created, create a new account owned by payer and mint 1,000 tokens
  localSPLData.forEach(async (splData, index) => {
    const token = new Token(
      connection,
      new PublicKey(splData.mintAddress),
      TOKEN_PROGRAM_ID,
      payer,
    );

    const newTokenAccount = await token.getOrCreateAssociatedAccountInfo(
      walletAddress ? new PublicKey(walletAddress) : payer.publicKey,
    );
    const tokenAccountKey = newTokenAccount.address;
    // The tokens created by the seedLocalNet have 8 decimals
    const amount = new u64(1_000_000_000).mul(new u64(10).pow(new u64(8)));
    token.mintTo(tokenAccountKey, payer, [], amount);
    console.log(
      `** created account ${tokenAccountKey} with ${amount.toString()} ${
        splData.mintAddress
      } tokens\n`,
    );
  });
})();
