## Run the App locally

1. Clone the repo

`git clone https://github.com/mithraiclabs/psyoptions-frontend.git`

2. Copy `.env-example` and rename it `.env`.

OR run `touch .env` and add the following lines to it and fill in the blanks:

```
REACT_APP_LOCAL_PROGRAM_ID=R2y9ip6mxmWUj4pt54jP2hz2dgvMozy9VTSwMWE7evs
REACT_APP_DEVNET_PROGRAM_ID=R2y9ip6mxmWUj4pt54jP2hz2dgvMozy9VTSwMWE7evs
REACT_APP_MAINNET_PROGRAM_ID=R2y9ip6mxmWUj4pt54jP2hz2dgvMozy9VTSwMWE7evs
REACT_APP_LOCAL_DEX_PROGRAM_ID=9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin
REACT_APP_DEVNET_DEX_PROGRAM_ID=DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY
REACT_APP_MAINNET_DEX_PROGRAM_ID=9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin
REACT_APP_DEVNET_FAUCET_USDC='E6wQSMPGqHn7dqEMeWcSVfjdkwd8ED5CncQ9BtMNGtUG'
REACT_APP_DEVNET_FAUCET_BTC='97z3NzcDxqRMyE7F73PuHEmAbA72S7eDopjhe7GTymTk'
REACT_APP_DEVNET_FAUCET_PSY='7jJJnHWagPPG544FtxSVp8eD52FwCsARcqqup1q3XVio'
DEX_REPO="/Users/ExampleUser/mithraiclabs/serum-dex"
KEY_FILE="/Users/ExampleUser/.config/solana/id.json"
WALLET_ADDRESS="StQPVao4aR5b2VJ71bB9Gb6aKnHi4kK6oDK7JVLnMRh"
ESLINT_NO_DEV_ERRORS=true
TSC_COMPILE_ON_ERROR=true
```
To use mainnet locally add this

```
REACT_APP_MAINNET_PROGRAM_ID=R2y9ip6mxmWUj4pt54jP2hz2dgvMozy9VTSwMWE7evs
```

*** Don't use Node 17 ***


3. Install dependencies

`yarn`

4. Run the app!

`yarn start`

## Protocol Development

> Note this is presently unsupported. Fixes coming soon

We aim to make development setup as easy as possible. Follow the steps below:

1. Run `yarn wholeShebang`
   - This will run a few scripts to build the programs, run a local Solana network (with
     Psy American and Serum DEX deployed to the right addresses at genesis) airdrop SOL to
     your wallet, create and airdrop SPL tokens to your wallet, deploy PsyOptions,
     deploy Serum, and create an example PsyOptions market with a Serum market attached.
2. In a separate temrinal `yarn dev`
   - This will run the local UI server

### Extracting market meta data

```console
./node_modules/ts-node/dist/bin.js scripts/extractMetaDataFromMarkets.ts --rpc-url http://localhost:8899 --psyoption-program-id LOCAL_PROGRAM_ID --dex-program-id LOCAL_DEX_PROGRAM_ID --mint1-address MINT1_ADDRESS --mint2-address MINT2_ADDRESS
```

### Deploying the app to dev and prod:

See <a href="https://github.com/mithraiclabs/solana-options-frontend/blob/master/docs/Deploying.md">Deploy Docs</a>

### Troubleshooting

If a build fails in google cloud, you can run `yarn build-docker` locally to simulate a cloud build and debug errors.
