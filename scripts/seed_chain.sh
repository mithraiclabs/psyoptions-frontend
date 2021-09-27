# airdrop tokens before
solana airdrop 100
solana airdrop 100 $WALLET_ADDRESS
cd $FRONTEND_REPO
# seed the chain with multiple assets
yarn seed -- $KEY_FILE
yarn seed:mintTokens -- $KEY_FILE $WALLET_ADDRESS

# initialization of markets can and should be done using the website.
yarn seed:localChain