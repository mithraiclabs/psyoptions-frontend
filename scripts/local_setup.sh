#!/bin/bash
set -xe

echo 'running local setup'

cd $OPTIONS_REPO
# set the config to localnet
solana config set --url http://localhost:8899 --keypair $KEY_FILE
# airdrop tokens before 
solana airdrop 100
solana airdrop 100 $WALLET_ADDRESS

# build the programs
anchor build
# deploy the program
anchor deploy

# Deploy the Serum DEX
cd $DEX_REPO
cargo build-bpf --manifest-path dex/Cargo.toml
solana program deploy $DEX_REPO/dex/target/deploy/serum_dex.so
# TODO append the DEX program ID to the .env file if it is not already there

cd $FRONTEND_REPO
# seed the chain with multiple assets
npm run seed -- $KEY_FILE
sleep 10
npm run seed:mintTokens -- $KEY_FILE $WALLET_ADDRESS

# This is broken right now.
# initialization of markets can and should be done using the website.
# npm run seed:localChain $OPTIONS_REPO/target/deploy/psy_american-keypair.json