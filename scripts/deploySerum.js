const fs = require('fs');
const yaml = require('js-yaml');
const os = require('os');
const SolWeb3 = require('@solana/web3.js')
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const argv = require('minimist')(process.argv.slice(2));

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

;(async () => {
  // Get the default keypair and airdrop some tokens
  const keyBuffer = fs.readFileSync(solanaConfig.keypair_path);
  const payer = new Account(JSON.parse(keyBuffer));

  const connection = new Connection('http://127.0.0.1:8899')
  if (argv.airdrop) {
    const amount = parseInt(argv.airdrop)
    await requestAndWaitForAirdrop(connection, amount * LAMPORTS_PER_SOL, payer);
  }

  // check that a program key file exists
  const serumDexKeypairPath = './serum/dex/serum_dex-keypair.json';
  const localDexProgramKeyFileExists = fs.existsSync(serumDexKeypairPath);
  console.log('localDexProgramKeyFileExists', localDexProgramKeyFileExists);
  if (!localDexProgramKeyFileExists) {
    console.log('\nLocalnet keypair file for the Serum dex program does not exists...creating one\n');
    const { stdout, stderr } = await exec(`solana-keygen new --no-passphrase --outfile ${serumDexKeypairPath}`);
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);
  }

  // Use the upgradable deployer to deploy the program.
  // TODO use output stream so there is more user feedback that the program is deploying.
  console.log('\nDeploying the Serum dex...\n');
  const { stdout, stderr } = await exec(`solana program deploy --program-id ${serumDexKeypairPath} ./serum/dex/serum_dex.so`)
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);


})();
