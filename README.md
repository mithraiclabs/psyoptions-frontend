## Seeding LocalNet
To use a local net keypair file run `npm run seed -- PATH_TO_KEYPAIR_FILE`. This script will **not** airdrop SOL, so be sure to have enough in the account or use the [solana cli](https://docs.solana.com/cli/transfer-tokens#testing-your-wallet) to airdrop prior to seeding. 

You can also seed without the keypair file by running `npm run seed`. 

Using the keypair file will allow you to mint the SPL tokens the seed generates because the keypair will be the authority of those mints. You can then create the necessary token accounts with the [solana-token cli](https://spl.solana.com/token).

To generate accounts and mint some of the newly generated SPL Tokens run `npm run seed:mintTokens -- PATH_TO_KEYPAIR_FILE WALLET_ADDRESS`. Specify `WALLET_ADDRESS` which will be the owner of the new accounts.

## Deploying Serum
Set your `solana` configs appropriately. Then run the deployer with `node scripts/deploySerum.js`. 

| Option Flags | Description |
| ------------ | ----------- |
| --airdrop | An integer value that determines how much SOL to airdrop to the keypair before running the deployer |
| --pullDex | A truthy value to indicate the script should download the latest dex binary from mainnet |
