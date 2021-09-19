import dotenv from 'dotenv';
import { exec, spawn } from 'child_process';
import * as fetch from 'node-fetch';
import * as fs from 'fs';

import { wait } from './helpers';

// create logs directory if it doesn't exist
!fs.existsSync(`./logs/`) && fs.mkdirSync(`./logs/`, { recursive: true });

dotenv.config();

(async () => {
  // wait until the chain is up
  try {
    const res = await fetch('http://localhost:8899');
    if (res.status !== 0) {
      console.log('**** chain is up');
    }
  } catch (error) {
    console.log('**** chain is down, please run `solana-test-validator`');
    return;
  }

  // Run a bash script to set up a lot of stuff
  const localSetupStream = fs.createWriteStream('./logs/localSetup.log', {
    flags: 'w',
  });
  const localSetupProc = exec(
    './scripts/local_setup.sh',
    {
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
    },
    () => {
      console.log('********* DONE LOCAL SETUP *********');
    },
  );
  localSetupProc.stdout.pipe(localSetupStream);
  localSetupProc.stderr.pipe(localSetupStream);
  localSetupProc.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  localSetupProc.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  localSetupProc.on('close', (code) => {
    console.log(`local_setup.sh process exited with code ${code}`);
  });
})();
