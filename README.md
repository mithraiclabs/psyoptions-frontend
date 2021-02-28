## Seeding LocalNet
To use a local net keypair file run `npm run seed -- PATH_TO_KEYPAIR_FILE`. This script will **not** airdrop SOL, so be sure to have enough in the account or use the [solana cli](https://docs.solana.com/cli/transfer-tokens#testing-your-wallet) to airdrop prior to seeding. 

You can also seed without the keypair file by running `npm run seed`. 

Using the keypair file will allow you to mint the SPL tokens the seed generates because the keypair will be the authority of those mints. You can then create the necessary token accounts with the [solana-token cli](https://spl.solana.com/token).

To generate accounts and mint some of the newly generated SPL Tokens run `npm run seed:mintTokens -- PATH_TO_KEYPAIR_FILE WALLET_ADDRESS`. Specify `WALLET_ADDRESS` which will be the owner of the new accounts.

## Scripts
### Deploying Serum
Set your `solana` configs appropriately. Then run the deployer with `node scripts/deploySerum.js`. 

| Option Flags | Description |
| ------------ | ----------- |
| --airdrop | An integer value that determines how much SOL to airdrop to the keypair before running the deployer |
| --pullDex | A truthy value to indicate the script should download the latest dex binary from mainnet |

### Initialize Serum
NOTE: After many hours failing to intiialize on local net due to the following error `Program failed to complete: Access violation in unknown section at address 0x27f2f7ac290d7fe9 of size 1 by instruction #18168` we are working on a script to ensure Devnet contains Serum markets and data necessary to give the full experience of the protocol and UI.

1. Set your `solana` config to your Devnet configuration (i.e. change the url and the keypair being used)
2. Make sure you airdrop some SOL `solana airdrop 10`
3. Run the initialize market script `node scripts/initializeSerumMarket.js`
