const fs = require('fs');
const yaml = require('js-yaml');
const os = require('os');
const SolWeb3 = require('@solana/web3.js')

const {
  Account,
  Connection,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
} = SolWeb3;

// Read the default key file
const HOME = os.homedir()
const configYml = fs.readFileSync(`${HOME}/.config/solana/cli/config.yml`, 'utf-8');
const solanaConfig = yaml.load(configYml);
// Exit if the user is not pointing to local net
if (!solanaConfig.json_rpc_url.match(/127\.0\.0\.1|localhost/)) {
  console.log("It looks like you're Solana configuration file is not pointed to localnet. Please make sure you are using the correct network and keypair.");
  process.exit(1);
}

const requestAndWaitForAirdrop = async (connection, amount, account) => {
  const priorBalance = await connection.getBalance(account.publicKey);
  await connection.requestAirdrop(account.publicKey, amount)
  let retries = 60
  for (;;) {
    // sleep half a second
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const balance = await connection.getBalance(account.publicKey)
    console.log('account balance ', balance)
    if (amount === balance - priorBalance) {
      return account
    }
    if (--retries <= 0) {
      throw new Error('Failed to airdrop SOL to payer for seed')
    }
  }
}

// Get the default keypair and airdrop some tokens
;(async () => {
  const keyBuffer = fs.readFileSync(solanaConfig.keypair_path);
  const payer = new Account(JSON.parse(keyBuffer));

  const connection = new Connection('http://127.0.0.1:8899')
  await requestAndWaitForAirdrop(connection, 100 * LAMPORTS_PER_SOL, payer);

  console.log('*** solana config', solanaConfig);
})();
