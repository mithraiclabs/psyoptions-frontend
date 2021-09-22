import { Connection, PublicKey } from '@solana/web3.js';
import { Market } from '@mithraic-labs/psyoptions';
import { Market as SerumMarket } from '@mithraic-labs/serum';
import * as yargs from 'yargs';
const fs = require('fs');

yargs
  .option('rpc-url', {
    type: 'string',
    description: 'Solana RPC url',
  })
  .option('psyoption-program-id', {
    alias: 'psy-d',
    type: 'string',
    description: 'The PsyOptions program ID',
  })
  .option('dex-program-id', {
    alias: 'serum-id',
    type: 'string',
    description: 'The Serum program ID',
  })
  .option('mint1-address', {
    type: 'string',
    description: 'The PublicKey for the first mint of the pair',
  })
  .option('mint2-address', {
    type: 'string',
    description: 'The PublicKey for the second mint of the pair',
  });
const wait = (delayMS: number) =>
  new Promise((resolve) => setTimeout(resolve, delayMS));

const OPTION_PROGRAM_ID = new PublicKey(
  yargs.argv['psyoption-program-id'] ||
    'R2y9ip6mxmWUj4pt54jP2hz2dgvMozy9VTSwMWE7evs',
);

const DEX_PROGRAM_ID = new PublicKey(
  yargs.argv['dex-program-id'] ||
    'DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY',
);

(async () => {
  const connection = new Connection(
    (yargs.argv['rpc-url'] as string) || 'https://api.devnet.solana.com',
  );

  const devnetBTCKey = new PublicKey(
    yargs.argv['mint1-address'] ||
      'C6kYXcaRUMqeBF5fhg165RWU7AnpT9z92fvKNoMqjmz6',
  );
  const devnetUSDCKey = new PublicKey(
    yargs.argv['mint2-address'] ||
      'E6Z6zLzk8MWY3TY8E87mr88FhGowEPJTeMWzkqtL6qkF',
  );

  let res = await Market.getAllMarketsBySplSupport(
    connection,
    OPTION_PROGRAM_ID,
    [devnetBTCKey, devnetUSDCKey],
  );

  const marketMetaData = [];
  const starterPromise = Promise.resolve(null);
  await res.reduce(async (accumulator, market) => {
    await accumulator;
    // Avoid RPC node limits
    await wait(1000);
    try {
      const underlyingAssetMint =
        market.marketData.underlyingAssetMintKey.toString();
      const quoteAssetMint = market.marketData.quoteAssetMintKey.toString();

      const serumMarketMeta = await SerumMarket.findAccountsByMints(
        connection,
        market.marketData.optionMintKey,
        devnetUSDCKey,
        DEX_PROGRAM_ID,
      );

      marketMetaData.push({
        expiration: market.marketData.expiration,
        optionMarketAddress: market.marketData.optionMarketKey.toString(),
        optionContractMintAddress: market.marketData.optionMintKey.toString(),
        optionWriterTokenMintAddress:
          market.marketData.writerTokenMintKey.toString(),
        quoteAssetMint,
        quoteAssetPoolAddress: market.marketData.quoteAssetPoolKey.toString(),
        underlyingAssetMint,
        underlyingAssetPoolAddress:
          market.marketData.underlyingAssetPoolKey.toString(),
        underlyingAssetPerContract:
          market.marketData.amountPerContract.toString(),
        quoteAssetPerContract:
          market.marketData.quoteAmountPerContract.toString(),
        serumMarketAddress: serumMarketMeta[0]?.publicKey?.toString(),
        serumProgramId: DEX_PROGRAM_ID.toString(),
        psyOptionsProgramId: OPTION_PROGRAM_ID.toString(),
      });
    } catch (error) {
      console.log(`ERROR: for market ${market.pubkey.toString()}\n`, error);
    }
    return null;
  }, starterPromise);

  const outputFile = 'marketMeta.json';
  fs.writeFile(outputFile, JSON.stringify(marketMetaData), (err) => {
    if (err) throw err;
    console.log('Saved!');
  });
})();
