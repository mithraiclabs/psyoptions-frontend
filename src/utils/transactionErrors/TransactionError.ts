import { Transaction } from '@solana/web3.js';

export type InstructionError = [
  number,
  {
    Custom: number;
  },
];

export default class TransactionError extends Error {
  public txid: string;

  public transaction: Transaction;

  public instructionError?: InstructionError;

  constructor(message: string, transaction: Transaction, txid?: string) {
    super(message);
    this.txid = txid;
    this.transaction = transaction;
    if (message.match(/{"InstructionError":\[\d+,{"Custom":\d+}\]}/)) {
      this.instructionError = JSON.parse(message).InstructionError;
    }
  }
}
