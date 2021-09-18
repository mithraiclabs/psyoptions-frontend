import dotenv from 'dotenv';
import { exec, spawn } from 'child_process';
import * as fetch from 'node-fetch';

import { wait } from './helpers';

dotenv.config();

// start the chain...should it be in the parent process or child process?
const proc = spawn('bash', ['yarn localnet:up'], {
  cwd: process.env.OPTIONS_REPO,
  shell: true,
});
proc.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

proc.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

proc.on('close', (code) => {
  console.log(`localnet process exited with code ${code}`);
  process.exit(-1);
});
(async () => {
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

  // Run a bash script to set up a lot of stuff
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
