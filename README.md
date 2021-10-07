## Configuring the app for local development:

Copy `.env-example` and rename it `.env.local`.

OR run `touch .env.local` and add the following lines to it and fill in the blanks:

**Next.js will read from .env.local. Only env variables prepended with `NEXT_PUBLIC_` will be shared in the browser**

Please add environment variables into the CodePipeline Build configuration in order for them to be accessible
when Next.js builds static pages.

```
NEXT_PUBLIC_LOCAL_PROGRAM_ID=R2y9ip6mxmWUj4pt54jP2hz2dgvMozy9VTSwMWE7evs
NEXT_PUBLIC_DEVNET_PROGRAM_ID=R2y9ip6mxmWUj4pt54jP2hz2dgvMozy9VTSwMWE7evs
NEXT_PUBLIC_LOCAL_DEX_PROGRAM_ID=9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin
NEXT_PUBLIC_DEVNET_DEX_PROGRAM_ID=DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY
NEXT_PUBLIC_INITIALIZE_PAGE_ENABLED='true'

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
2. In a separate temrinal `yarn dev`
   - This will run the local UI server

### Extracting market meta data

```console
./node_modules/ts-node/dist/bin.js scripts/extractMetaDataFromMarkets.ts --rpc-url http://localhost:8899 --psyoption-program-id NEXT_PUBLIC_LOCAL_PROGRAM_ID --dex-program-id NEXT_PUBLIC_LOCAL_DEX_PROGRAM_ID --mint1-address MINT1_ADDRESS --mint2-address MINT2_ADDRESS
```

### Deploying the app to dev and prod:

See <a href="https://github.com/mithraiclabs/solana-options-frontend/blob/master/docs/Deploying.md">Deploy Docs</a>

### Troubleshooting

If a build fails in google cloud, you can run `yarn build-docker` locally to simulate a cloud build and debug errors.
