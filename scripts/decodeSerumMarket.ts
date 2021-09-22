import { Connection, PublicKey } from '@solana/web3.js';
import { Market as SerumMarket } from '@mithraic-labs/serum';
import * as yargs from 'yargs';

yargs
  .option('rpc-url', {
    type: 'string',
    description: 'Solana RPC url',
  })
  .option('dex-program-id', {
    alias: 'serum-id',
    type: 'string',
    description: 'The Serum program ID',
  })
  .option('serum-market', {
    alias: 'm',
    type: 'string',
    description: 'The serum market id',
  });

const DEX_PROGRAM_ID = new PublicKey(
  yargs.argv['dex-program-id'] || 'R2y9ip6mxmWUj4pt54jP2hz2dgvMozy9VTSwMWE7evs',
);

(async () => {
  const connection = new Connection(
    (yargs.argv['rpc-url'] as string) || 'https://api.devnet.solana.com',
  );

  const marketId = new PublicKey(yargs.argv['serum-market']);

  const market = await SerumMarket.load(
    connection,
    marketId,
    {},
    DEX_PROGRAM_ID,
  );

  console.log(`
  Serum Market: ${marketId.toString()}\n
  Base Mint: ${market.baseMintAddress.toString()}\n
  Quote Mint: ${market.quoteMintAddress.toString()}\n
  `);
})();
