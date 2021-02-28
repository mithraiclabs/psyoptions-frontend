import fs from 'fs';
import yaml from 'js-yaml';
import os from 'os';
import {} from '@project-serum/serum';

export const serumDexProgramKeypair = './serum/dex/serum_dex-keypair.json';
export const serumDexBinaryPath = './serum/dex/serum_dex.so';

export const getSolanaConfig = () => {
  // Read the default key file
  const HOME = os.homedir()
  const configYml = fs.readFileSync(`${HOME}/.config/solana/cli/config.yml`, 'utf-8');
  return yaml.load(configYml);
}

export const validateLocalnet = (solanaConfig) => {
  // Exit if the user is not pointing to local net
  if (!solanaConfig.json_rpc_url.match(/127\.0\.0\.1|localhost/)) {
    console.log("It looks like you're Solana configuration file is not pointed to localnet. Please make sure you are using the correct network and keypair.");
    process.exit(1);
  }
} 

export const requestAndWaitForAirdrop = async (connection, amount, account) => {
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


const seedSerumMarket = (
  marketAddress
) => {

}