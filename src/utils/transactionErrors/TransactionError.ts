export type InstructionError = {
  InstructionError: [
    number,
    {
      Custom: number
    },
  ]
}
export default class TransactionError extends Error {
  public txid: string

  public instructionError?: InstructionError

  constructor(message: string, txid?: string) {
    super(message)
    this.txid = txid
    if (message.match(/{"InstructionError":\[\d+,{"Custom":\d+}\]}/)) {
      this.instructionError = JSON.parse(message)
    }
  }
}
