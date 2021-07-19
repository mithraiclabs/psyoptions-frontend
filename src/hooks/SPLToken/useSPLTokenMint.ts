import { MintInfo, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Account, PublicKey } from '@mithraic-labs/solana-web3.js'
import { useEffect } from 'react'
import * as Sentry from '@sentry/react'
import { useSPLTokenMints } from '../../context/SPLTokenMintsContext'
import useConnection from '../useConnection'

/**
 * Fetch and update global context state with SPL Token mint info.
 *
 * @param mint
 * @returns
 */
export const useSPLTokenMintInfo = (
  mint: PublicKey | undefined,
): MintInfo | null => {
  const { connection } = useConnection()
  const [splTokenMints, setSPLTokenMints] = useSPLTokenMints()

  useEffect(() => {
    if (mint) {
      const token = new Token(connection, mint, TOKEN_PROGRAM_ID, new Account())
      ;(async () => {
        try {
          const mintInfo = await token.getMintInfo()
          setSPLTokenMints((mints) => ({
            ...mints,
            [mint.toString()]: mintInfo,
          }))
        } catch (err) {
          console.error(err)
          Sentry.captureException(err)
        }
      })()
    }
  }, [connection, mint, setSPLTokenMints])

  if (!mint) {
    return null
  }

  return splTokenMints[mint.toString()]
}
