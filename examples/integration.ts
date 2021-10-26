import { PsyAmericanIdl } from '@mithraic-labs/psy-american';
import { Program, Provider } from '@project-serum/anchor';
import { NodeWallet } from '@project-serum/anchor/dist/cjs/provider';
import { Commitment, Connection, PublicKey } from '@solana/web3.js';
import { MarketMeta } from '@mithraic-labs/market-meta';
import * as fs from 'fs';
import * as os from 'os';

function readKeypair() {
  return JSON.parse(
    process.env.KEYPAIR ||
      fs.readFileSync(os.homedir() + '/.config/solana/devnet.json', 'utf-8'),
  );
}

const WRAPPED_SOL_ADDRESS = new PublicKey(
  'So11111111111111111111111111111111111111112',
);

// Below we create the Anchor Program from the PsyAmerican IDL,
//  devnet connection, and wallet keypair
const PSY_PROGRAM_ID = new PublicKey(
  'R2y9ip6mxmWUj4pt54jP2hz2dgvMozy9VTSwMWE7evs',
);
const connection = new Connection(
  'https://api.devnet.solana.com',
  'processed' as Commitment,
);
const wallet = new NodeWallet(readKeypair());
const provider = new Provider(connection, wallet, { commitment: 'processed' });
const program = new Program(PsyAmericanIdl, PSY_PROGRAM_ID, provider);

// Filter devnet markets to only unexpired markets
// TODO: Filter for only SOL markets
const activeDevnetMarkets = MarketMeta.devnet.optionMarkets.filter(
  (marketMeta) => marketMeta.expiration * 1000 > new Date().getTime(),
);

// TODO: Provide gist for minting an option

// TODO: Provide example for posting an order to the permissioned markets
