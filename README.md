## Configuring the app for local development:

Copy `.env-example` and rename it `.env`.

OR run `touch .env` and add the following lines to it:

```
DEVNET_PROGRAM_ID=GDvqQy3FkDB2wyNwgZGp5YkmRMUmWbhNNWDMYKbLSZ5N
DEVNET_DEX_PROGRAM_ID=DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY
GRAPHQL_URL=http://localhost:8080/v1/graphql
APP_ENABLED=true
```

## Development

We aim to make development setup as easy as possible. Follow the steps below:

1. Run `npm run wholeShebang`
   - This will run a few scripts to run a local Solana network, airdrop SOL to
     your wallet, create and airdrop SPL tokens to your wallet, deploy PsyOptions,
     deploy Serum, and create an example PsyOptions market with a Serum market attached.
2. Run `npm run start`
   - This will run the local UI server

### Extracting market meta data

```console
./node_modules/ts-node/dist/bin.js scripts/extractMetaDataFromMarkets.ts --rpc-url http://localhost:8899 --psyoption-program-id LOCAL_PROGRAM_ID --dex-program-id LOCAL_DEX_PROGRAM_ID --mint1-address MINT1_ADDRESS --mint2-address MINT2_ADDRESS
```

### Deploying the app to dev and prod:

See <a href="https://github.com/mithraiclabs/solana-options-frontend/blob/master/docs/Deploying.md">Deploy Docs</a>

### Troubleshooting

If a build fails in google cloud, you can run `npm run build-docker` locally to simulate a cloud build and debug errors.
