# airdrop tokens before
solana airdrop 100
solana airdrop 100 $WALLET_ADDRESS
cd $FRONTEND_REPO
# seed the chain with multiple assets
npm run seed -- $KEY_FILE
npm run seed:mintTokens -- $KEY_FILE $WALLET_ADDRESS

# This is broken right now.
# initialization of markets can and should be done using the website.
# npm run seed:localChain