## Configuring the app for local development:

Copy `.env-example` and rename it `.env`

OR run `touch .env` and add the following lines to it:

```
DEVNET_PROGRAM_ID='7UkUQY1gqYyumhyoDy73D5JoThqGY9SJw21k6QveesfP'
DEVNET_DEX_PROGRAM_ID='DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY'
APP_ENABLED=true
```

## Seeding LocalNet

To use a local net keypair file run `npm run seed -- PATH_TO_KEYPAIR_FILE`. This script will **not** airdrop SOL, so be sure to have enough in the account or use the [solana cli](https://docs.solana.com/cli/transfer-tokens#testing-your-wallet) to airdrop prior to seeding.

You can also seed without the keypair file by running `npm run seed`.

Using the keypair file will allow you to mint the SPL tokens the seed generates because the keypair will be the authority of those mints. You can then create the necessary token accounts with the [solana-token cli](https://spl.solana.com/token).

To generate accounts and mint some of the newly generated SPL Tokens run `npm run seed:mintTokens -- PATH_TO_KEYPAIR_FILE WALLET_ADDRESS`. Specify `WALLET_ADDRESS` which will be the owner of the new accounts.

## Scripts

### Deploying Serum

Set your `solana` configs appropriately. Then run the deployer with `node scripts/deploySerum.js`.

| Option Flags | Description                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------- |
| --airdrop    | An integer value that determines how much SOL to airdrop to the keypair before running the deployer |
| --pullDex    | A truthy value to indicate the script should download the latest dex binary from mainnet            |

### Initialize Serum

NOTE: After many hours failing to intiialize on local net due to the following error `Program failed to complete: Access violation in unknown section at address 0x27f2f7ac290d7fe9 of size 1 by instruction #18168` we are working on a script to ensure Devnet contains Serum markets and data necessary to give the full experience of the protocol and UI.

1. Set your `solana` config to your Devnet configuration (i.e. change the url and the keypair being used)
2. Make sure you airdrop some SOL `solana airdrop 10`
3. Run the initialize market script `npx babel-node scripts/initializeSerumMarket.js --baseMint=BASE_MINT --quoteMint=QUOTE_MINT`

## Interacting on Devnet

We use a couple SPL Token faucets to interact on devnet. To use the faucets visit this community built site and be sure to set the network to **devnet**.
https://spl-token-ui.netlify.app/#/token-faucets

We use the same BTC, SRM, etc addresses that Mango Markets uses. You can find the faucet addresses [here](https://github.com/blockworks-foundation/mango-client-ts/blob/main/src/ids.json#L10)

```
Token Symbol: PSYA
Faucet Address: 7jJJnHWagPPG544FtxSVp8eD52FwCsARcqqup1q3XVio
Mint Address: BzwRWwr1kCLJVUUM14fQthP6FJKrGpXjw3ZHTZ6PQsYa
```

```
Token Symbol: USDCT
Faucet Address: BmaVN3Wut1k2MtrcsxjTn919GdBJ2gzVLTtbiybnAPnR
Mint Address: HinfVnJuzMtJsyuLE2ArYCChDZB6FCxEu2p3CQeMcDiF
```

### Example: To Airdrop PSYA Tokens

1. Go to Sollet.io
2. Set netowrk to **DEVNET**
3. Click + to add a token account manually. Enter the following and submit

```
 Token Mint Address: _BzwRWwr1kCLJVUUM14fQthP6FJKrGpXjw3ZHTZ6PQsYa_
 Token Name: PSYA Test
 Token Symbol: PSYA
```

4. Head to the [Token Faucet](https://spl-token-ui.netlify.app/#/token-faucets) to perform a "Token Airdrop". Enter the following

```
Token Destination Address: The "Deposit Address" from the token account you just created on Sollet
Faucet Address: 7jJJnHWagPPG544FtxSVp8eD52FwCsARcqqup1q3XVio
Amount: 1000000000000 (or whatever you feel)
```

DEV cloud run url: https://solana-options-frontend-ckpgwptysa-uc.a.run.app/
