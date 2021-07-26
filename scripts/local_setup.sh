#!/bin/bash
set -xe

echo 'running local setup'

cd $OPTIONS_REPO
# build the Options program
cargo build-bpf --manifest-path options/Cargo.toml
# set the config to localnet
solana config set --url http://localhost:8899 --keypair $KEY_FILE
# airdrop tokens before 
solana airdrop 100
solana airdrop 100 $WALLET_ADDRESS

# create local program keypair if not exists
if test -f $OPTIONS_REPO/options/deployed_programs/psyoptions-local-keypair.json; then
  echo "local keypair file exists"
else
  solana-keygen new --no-passphrase --outfile $OPTIONS_REPO/options/deployed_programs/psyoptions-local-keypair.json
fi
# deploy the program
solana program deploy --program-id $OPTIONS_REPO/options/deployed_programs/psyoptions-local-keypair.json $OPTIONS_REPO/options/target/deploy/psyoptions.so

# Deploy the Serum DEX
cd $DEX_REPO
cargo build-bpf --manifest-path dex/Cargo.toml
solana program deploy $DEX_REPO/dex/target/deploy/serum_dex.so

cd $FRONTEND_REPO
# seed the chain with multiple assets
npm run seed -- $KEY_FILE
sleep 10
npm run seed:mintTokens -- $KEY_FILE $WALLET_ADDRESS

npm run seed:localChain $OPTIONS_REPO/options/deployed_programs/psyoptions-local-keypair.json