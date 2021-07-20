import { MintInfo, MintLayout, u64 } from '@solana/spl-token'
import { PublicKey } from '@mithraic-labs/solana-web3.js'
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
export const useBatchLoadMints = (mints: PublicKey[]) => {
  const { connection } = useConnection()
  const [splTokenMints, setSPLTokenMints] = useSPLTokenMints()

  useEffect(() => {
    ;(async () => {
      try {
        const infos = await connection.getMultipleAccountsInfo(mints)
        const mintInfos: Record<string, MintInfo> = {}
        infos.forEach((info, index) => {
          const mintInfo = MintLayout.decode(info.data)
          if (mintInfo.mintAuthorityOption === 0) {
            mintInfo.mintAuthority = null
          } else {
            mintInfo.mintAuthority = new PublicKey(mintInfo.mintAuthority)
          }

          mintInfo.supply = u64.fromBuffer(mintInfo.supply)
          mintInfo.isInitialized = mintInfo.isInitialized !== 0

          if (mintInfo.freezeAuthorityOption === 0) {
            mintInfo.freezeAuthority = null
          } else {
            mintInfo.freezeAuthority = new PublicKey(mintInfo.freezeAuthority)
          }
          mintInfos[mints[index].toString()] = mintInfo
        })
        setSPLTokenMints((_mintInfos) => ({
          ..._mintInfos,
          ...mintInfos,
        }))
      } catch (err) {
        console.error(err)
        Sentry.captureException(err)
      }
    })()
  }, [connection, mints, setSPLTokenMints])

  return splTokenMints
}
