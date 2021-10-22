/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Commitment,
  Connection,
  Keypair,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import { ConnectedWallet } from "@saberhq/use-solana";
import { TimeoutError } from './transactionErrors/TimeoutError';

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const getUnixTs = (): number => {
  return new Date().getTime() / 1000;
};

export async function signTransaction({
  transaction,
  wallet,
  signers = [],
  connection,
}: {
  transaction: Transaction;
  wallet: ConnectedWallet;
  signers?: Array<Keypair>;
  connection: Connection;
}): Promise<Transaction> {
  const tx = transaction;
  tx.recentBlockhash = (await connection.getRecentBlockhash('max')).blockhash;
  tx.feePayer = wallet.publicKey ?? undefined;
  if (signers.length > 0) {
    tx.partialSign(...signers);
  }
  return wallet.signTransaction(tx);
}

export async function signTransactions({
  transactionsAndSigners,
  wallet,
  connection,
}: {
  transactionsAndSigners: {
    transaction: Transaction;
    signers?: Array<Keypair>;
  }[];
  wallet: ConnectedWallet;
  connection: Connection;
}): Promise<Transaction[]> {
  const { blockhash } = await connection.getRecentBlockhash('max');
  const tempTransactionsAndSigners = transactionsAndSigners.map(
    ({ transaction, signers = [] }) => {
      const tx = transaction;
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey ?? undefined;

      if (signers?.length > 0) {
        transaction.partialSign(...signers);
      }
      return {
        transaction: tx,
        signers,
      };
    },
  );
  return wallet.signAllTransactions(
    tempTransactionsAndSigners.map(({ transaction }) => transaction),
  );
}

export async function awaitTransactionSignatureConfirmation(
  txid: TransactionSignature,
  timeout: number,
  connection: Connection,
): Promise<unknown> {
  let done = false;
  const res = await new Promise((resolve, reject) => {
    // eslint-disable-next-line
    (async () => {
      setTimeout(() => {
        if (done) {
          return;
        }
        done = true;
        reject(new TimeoutError('TX timed out', txid));
      }, timeout);
      try {
        connection.onSignature(
          txid,
          (result) => {
            done = true;
            if (result.err) {
              reject(result.err);
            } else {
              resolve(result);
            }
          },
          connection.commitment,
        );
      } catch (e) {
        done = true;
      }
      while (!done) {
        // eslint-disable-next-line
        (async () => {
          try {
            const signatureStatuses = await connection.getSignatureStatuses([
              txid,
            ]);
            const result = signatureStatuses && signatureStatuses.value[0];
            if (!done) {
              if (!result) {
                console.log('REST null result for', txid, result);
              } else if (result.err) {
                console.log('REST error for', txid, result);
                done = true;
                reject(result.err);
              } else if (
                !(
                  result.confirmations ||
                  result.confirmationStatus === 'confirmed' ||
                  result.confirmationStatus === 'finalized'
                )
              ) {
                console.log('REST not confirmed', txid, result);
              } else {
                console.log('REST confirmed', txid, result);
                done = true;
                resolve(result);
              }
            }
          } catch (e) {
            if (!done) {
              console.log('REST connection error: txid', txid, e);
            }
          }
        })();
        await sleep(300);
      }
    })();
  });
  done = true;
  return res;
}

/** Copy of Connection.simulateTransaction that takes a commitment parameter. */
export async function simulateTransaction(
  connection: Connection,
  transaction: Transaction,
  commitment: Commitment,
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
  const tx = transaction;
  // @ts-ignore
  tx.recentBlockhash = await connection._recentBlockhash(
    // @ts-ignore
    connection._disableBlockhashCaching,
  );

  const signData = tx.serializeMessage();
  // @ts-ignore
  const wireTransaction = tx._serialize(signData);
  const encodedTransaction = wireTransaction.toString('base64');
  const config = { encoding: 'base64', commitment };
  const args = [encodedTransaction, config];

  // @ts-ignore
  const res = await connection._rpcRequest('simulateTransaction', args);
  if (res.error) {
    throw new Error(`failed to simulate transaction: ${res.error.message}`);
  }
  return res.result;
}
