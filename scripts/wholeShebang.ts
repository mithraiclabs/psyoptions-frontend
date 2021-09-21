import dotenv from 'dotenv';
import { exec, spawn } from 'child_process';
import * as fetch from 'node-fetch';
import * as fs from 'fs';
import { wait } from './helpers';

// create logs directory if it doesn't exist
!fs.existsSync(`./logs/`) && fs.mkdirSync(`./logs/`, { recursive: true });

dotenv.config();

(async () => {
  // Run a bash script to set up a lot of stuff
  const chainSetupStream = fs.createWriteStream('./logs/chain_setup.log', {
    flags: 'w',
  });
  const chainSetupProc = spawn('bash', ['./scripts/chain_setup.sh'], {
    cwd: process.cwd(),
    env: {
      OPTIONS_REPO: process.env.OPTIONS_REPO,
      FRONTEND_REPO: process.env.FRONTEND_REPO,
      DEX_REPO: process.env.DEX_REPO,
      KEY_FILE: process.env.KEY_FILE,
      WALLET_ADDRESS: process.env.WALLET_ADDRESS,
      PATH: process.env.PATH,
      HOME: process.env.HOME,
    },
  });
  chainSetupProc.stdout.pipe(chainSetupStream);
  chainSetupProc.stderr.pipe(chainSetupStream);

  chainSetupProc.on('close', (code) => {
    console.log(`chain_setup.sh process exited with code ${code}`);
    process.exit(code);
  });

  // wait until the chain is up
  while (true) {
    try {
      const res = await fetch('http://localhost:8899');
      if (res.status !== 0) {
        console.log('**** chain is up, breaking');
        break;
      }
    } catch (error) {
      console.log('**** chain is down, waiting...');
    }
    await wait(1000);
  }

  const seedChainStream = fs.createWriteStream('./logs/seed_chain.log', {
    flags: 'w',
  });
  const seedChainProc = exec('./scripts/seed_chain.sh', {
    cwd: process.cwd(),
    env: {
      OPTIONS_REPO: process.env.OPTIONS_REPO,
      FRONTEND_REPO: process.env.FRONTEND_REPO,
      DEX_REPO: process.env.DEX_REPO,
      KEY_FILE: process.env.KEY_FILE,
      WALLET_ADDRESS: process.env.WALLET_ADDRESS,
      PATH: process.env.PATH,
      HOME: process.env.HOME,
    },
  });
  seedChainProc.stdout.pipe(seedChainStream);
  seedChainProc.stderr.pipe(seedChainStream);

  seedChainProc.on('close', (code) => {
    console.log(`seed_chain.sh process exited with code ${code}`);
    // Start logging the chain so the user knows it's still running in the terminal
    chainSetupProc.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
  });
})();
