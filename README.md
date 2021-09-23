## Configuring the app for local development:

Copy `.env-example` and rename it `.env`.

OR run `touch .env` and add the following lines to it and fill in the blanks:

```
LOCAL_PROGRAM_ID=R2y9ip6mxmWUj4pt54jP2hz2dgvMozy9VTSwMWE7evs
DEVNET_PROGRAM_ID=R2y9ip6mxmWUj4pt54jP2hz2dgvMozy9VTSwMWE7evs
LOCAL_DEX_PROGRAM_ID=9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin
DEVNET_DEX_PROGRAM_ID=DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY
APP_ENABLED=true
INITIALIZE_PAGE_ENABLED='true'

OPTIONS_REPO=
FRONTEND_REPO=
DEX_REPO=
KEY_FILE=
WALLET_ADDRESS=
```

## Development

We aim to make development setup as easy as possible. Follow the steps below:

1. Run `yarn wholeShebang`
   - This will run a few scripts to build the programs, run a local Solana network (with
     Psy American and Serum DEX deployed to the right addresses at genesis) airdrop SOL to
     your wallet, create and airdrop SPL tokens to your wallet, deploy PsyOptions,
     deploy Serum, and create an example PsyOptions market with a Serum market attached.
2. In a separate temrinal `yarn start`
   - This will run the local UI server

### Extracting market meta data

```console
./node_modules/ts-node/dist/bin.js scripts/extractMetaDataFromMarkets.ts --rpc-url http://localhost:8899 --psyoption-program-id LOCAL_PROGRAM_ID --dex-program-id LOCAL_DEX_PROGRAM_ID --mint1-address MINT1_ADDRESS --mint2-address MINT2_ADDRESS
```

### Deploying the app to dev and prod:

See <a href="https://github.com/mithraiclabs/solana-options-frontend/blob/master/docs/Deploying.md">Deploy Docs</a>

### Troubleshooting

If a build fails in google cloud, you can run `yarn build-docker` locally to simulate a cloud build and debug errors.
