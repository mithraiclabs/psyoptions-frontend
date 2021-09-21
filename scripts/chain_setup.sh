#!/bin/bash
set -xe

echo 'running local setup'

# set the config to localnet
solana config set --url http://localhost:8899 --keypair $KEY_FILE

# Build the Serum DEX
cd $DEX_REPO
cargo build-bpf --manifest-path dex/Cargo.toml
# solana program deploy $DEX_REPO/dex/target/deploy/serum_dex.so
# TODO append the DEX program ID to the .env file if it is not already there

cd $OPTIONS_REPO
# build the programs
anchor build

cd $FRONTEND_REPO/logs
if [[ -d test-ledger ]]
then 
  rm -r test-ledger
fi
# Start the chain with the Psy American and Serum DEX deployed 
solana-test-validator --bpf-program 9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin $DEX_REPO/dex/target/deploy/serum_dex.so --bpf-program 2EeLomtYKBwWvHmgHvTk9gECo6isXTC9MmbcExdHWmmb $OPTIONS_REPO/target/deploy/psy_american.so
