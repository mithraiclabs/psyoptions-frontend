## Seeding LocalNet
To use a local net keypair file run `npm run seed -- PATH_TO_KEYPAIR_FILE`. This script will **not** airdrop SOL, so be sure to have enough in the account or use the [solana cli](https://docs.solana.com/cli/transfer-tokens#testing-your-wallet) to airdrop prior to seeding. 

You can also seed without the keypair file by running `npm run seed`. However, using the keypair file will allow you to mint the SPL tokens the seed generates because the keypair will be the authority of those mints.
