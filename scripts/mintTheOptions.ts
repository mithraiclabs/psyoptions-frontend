import {
  Account,
  Connection,
  PublicKey,
  sendAndConfirmRawTransaction,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Market, mintCoveredCallInstruction } from '@mithraic-labs/psyoptions'
import BN from 'bn.js'
import { getSolanaConfig } from './helpers'

const fs = require('fs')

const MAX_MINTS_PER_TX = 40

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
)
const FAUCET_PROGRAM_ID = new PublicKey(
  '4bXpkKSV8swHSnwqtzuboGPaPDeEgAn4Vt8GfarV5rZt',
)
const OPTION_PROGRAM_ID = new PublicKey(
  'CUmVnHnQZGjeCmiYcF6ZfKrJKJ8uEW79QCWuxNdjLUBn',
)
const getPDA = () =>
  PublicKey.findProgramAddress([Buffer.from('faucet')], FAUCET_PROGRAM_ID)

const buildAirdropTokensIx = async (
  amount: BN,
  adminPubkey: PublicKey,
  tokenMintPublicKey: PublicKey,
  destinationAccountPubkey: PublicKey,
  faucetPubkey: PublicKey,
) => {
  const pubkeyNonce = await getPDA()

  const keys = [
    { pubkey: pubkeyNonce[0], isSigner: false, isWritable: false },
    {
      pubkey: tokenMintPublicKey,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: destinationAccountPubkey, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: faucetPubkey, isSigner: false, isWritable: false },
  ]

  if (adminPubkey) {
    keys.push({
      pubkey: adminPubkey,
      isSigner: true,
      isWritable: false,
    })
  }

  return new TransactionInstruction({
    programId: FAUCET_PROGRAM_ID,
    data: Buffer.from([1, ...amount.toArray('le', 8)]),
    keys,
  })
}

const getFaucetAddressByMint = (mint: PublicKey) => {
  switch (mint.toString()) {
    case 'E6Z6zLzk8MWY3TY8E87mr88FhGowEPJTeMWzkqtL6qkF':
      return new PublicKey('E6wQSMPGqHn7dqEMeWcSVfjdkwd8ED5CncQ9BtMNGtUG')
    case 'C6kYXcaRUMqeBF5fhg165RWU7AnpT9z92fvKNoMqjmz6':
      return new PublicKey('97z3NzcDxqRMyE7F73PuHEmAbA72S7eDopjhe7GTymTk')
    default:
      throw new Error(`Unknown faucet for mint: ${mint.toString()}`)
  }
}

/**
 * Before running this script
 */
;(async () => {
  const connection = new Connection('https://devnet.solana.com')
  const optionProgramKey = new PublicKey(
    'CUmVnHnQZGjeCmiYcF6ZfKrJKJ8uEW79QCWuxNdjLUBn',
  )
  // The amount of contracts to mint
  const amountStr = process.argv[2]
  const marketAddress = process.argv[3]
  const ownerAddress = process.argv[4]

  const solanaConfig = getSolanaConfig()
  const keyBuffer = fs.readFileSync(solanaConfig.keypair_path)
  const payer = new Account(JSON.parse(keyBuffer))

  const owner = ownerAddress ? new PublicKey(ownerAddress) : payer.publicKey
  console.log(`Owner = ${owner.toString()}`)

  // - decode the option market information to get the asset info
  if (!marketAddress) {
    console.error(
      'Must add a marketAddress or file path with array of market meta data',
    )
    process.exit(1)
  }

  let markets = []
  if (fs.existsSync(marketAddress)) {
    markets = JSON.parse(fs.readFileSync(marketAddress))
  } else {
    markets = [new PublicKey(marketAddress)]
  }

  const faucetAndMint = async (market: Market) => {
    const underlyingToken = new Token(
      connection,
      market.marketData.underlyingAssetMintKey,
      TOKEN_PROGRAM_ID,
      payer,
    )
    // const underlyingTokenMint = await underlyingToken.getMintInfo()
    try {
      await underlyingToken.createAssociatedTokenAccount(payer.publicKey)
    } catch (error) {
      console.log('Error creating option token account:\n', error)
    }
    // - get the associated underlying asset account for the payer
    const associatedUnderlyingTokenAccount = await underlyingToken.getOrCreateAssociatedAccountInfo(
      payer.publicKey,
    )
    console.log(
      '* associatedUnderlyingAccount',
      associatedUnderlyingTokenAccount.address.toString(),
    )

    // - fund account from faucet with
    const faucetPubkey = getFaucetAddressByMint(
      market.marketData.underlyingAssetMintKey,
    )

    const amountOfContracts = new BN(amountStr)
    const faucetAmount = amountOfContracts.mul(
      market.marketData.amountPerContract,
    )
    const ix = await buildAirdropTokensIx(
      faucetAmount,
      undefined,
      market.marketData.underlyingAssetMintKey,
      associatedUnderlyingTokenAccount.address,
      faucetPubkey,
    )
    const tx = new Transaction()
    tx.add(ix)
    tx.feePayer = payer.publicKey
    tx.recentBlockhash = (await connection.getRecentBlockhash('max')).blockhash
    await tx.partialSign(payer)
    const txId = await sendAndConfirmRawTransaction(
      connection,
      tx.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: 'recent',
        commitment: 'max',
      },
    )
    console.log(`* underlying faucet TX id: ${txId}`)
    // get an updated account info for the underlying asset token account

    // - mint options (chunk for max size)
    const numberOfMintTxs = Math.ceil(
      amountOfContracts.toNumber() / MAX_MINTS_PER_TX,
    )

    const numberOfContractsDistribution = new Array(numberOfMintTxs - 1).fill(
      MAX_MINTS_PER_TX,
    )
    /* Push the remaining contracts. If the mod is 0 then we know the total number of 
  is a multiple of MAX_MINTS_PER_TX so we push that */
    numberOfContractsDistribution.push(
      amountOfContracts.toNumber() % MAX_MINTS_PER_TX || MAX_MINTS_PER_TX,
    )

    const optionToken = new Token(
      connection,
      market.marketData.optionMintKey,
      TOKEN_PROGRAM_ID,
      payer,
    )
    const writerToken = new Token(
      connection,
      market.marketData.writerTokenMintKey,
      TOKEN_PROGRAM_ID,
      payer,
    )
    try {
      await optionToken.createAssociatedTokenAccount(owner)
    } catch (error) {
      console.log('Error creating option token account:\n', error)
    }

    try {
      await writerToken.createAssociatedTokenAccount(owner)
    } catch (error) {
      console.log('Error creating writer token account:\n', error)
    }

    const associatedOptionTokenKey = await Token.getAssociatedTokenAddress(
      optionToken.associatedProgramId,
      optionToken.programId,
      optionToken.publicKey,
      owner,
    )
    const associatedWriterTokenKey = await Token.getAssociatedTokenAddress(
      writerToken.associatedProgramId,
      writerToken.programId,
      writerToken.publicKey,
      owner,
    )

    // TODO check if the associated OptionToken and WriterToken accounts are
    //  already created or initialized
    console.log(
      `*** associated accounts:\nassociatedOptionTokenKey: ${associatedOptionTokenKey.toString()}\nassociatedWriterTokenKey: ${associatedWriterTokenKey.toString()}`,
    )
    console.log(
      '*** numberOfContractsDistribution',
      numberOfContractsDistribution,
    )
    const mintTXs = []
    await Promise.all(
      numberOfContractsDistribution.map(async (contractsToMint) => {
        const transaction = new Transaction()
        await Promise.all(
          Array(contractsToMint)
            .fill('')
            .map(async () => {
              const mintInstruction = await mintCoveredCallInstruction({
                authorityPubkey: payer.publicKey,
                programId: OPTION_PROGRAM_ID,
                optionMarketKey: market.pubkey,
                optionMintKey: market.marketData.optionMintKey,
                mintedOptionDestKey: associatedOptionTokenKey,
                writerTokenDestKey: associatedWriterTokenKey,
                writerTokenMintKey: market.marketData.writerTokenMintKey,
                underlyingAssetPoolKey:
                  market.marketData.underlyingAssetPoolKey,
                underlyingAssetSrcKey: associatedUnderlyingTokenAccount.address,
                fundingAccountKey: payer.publicKey,
                underlyingMintKey: market.marketData.underlyingAssetMintKey,
              })

              transaction.add(mintInstruction)
            }),
        )
        mintTXs.push(transaction)
      }),
    )
    console.log('*** mintTXs', mintTXs.length)
    const starterPromise = Promise.resolve(null)
    await mintTXs.reduce(async (accumulator, currentMintTx) => {
      await accumulator
      return (async () => {
        currentMintTx.feePayer = payer.publicKey
        currentMintTx.recentBlockhash = (
          await connection.getRecentBlockhash('max')
        ).blockhash
        await currentMintTx.partialSign(payer)
        const mintTxId = await sendAndConfirmRawTransaction(
          connection,
          currentMintTx.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: 'recent',
            commitment: 'max',
          },
        )
        console.log(`* confirmed mint TX id: ${mintTxId}`)
      })()
    }, starterPromise)
  }
  // Currently this runs sequentially to reduce (lol pun) load on Devnet and
  //  avoid being rate limited
  const starterPromise = Promise.resolve(null)
  await markets.reduce(async (accumulator, currentMarketMetaData) => {
    await accumulator
    return (async () => {
      const marketKey = new PublicKey(currentMarketMetaData.optionMarketAddress)
      const marketAccount = await connection.getAccountInfo(marketKey)
      const market = new Market(optionProgramKey, marketKey, marketAccount.data)
      return faucetAndMint(market)
    })()
  }, starterPromise)
})()

export {}
