import React, { useMemo } from 'react'
import Box from '@material-ui/core/Box'
import { useTheme } from '@material-ui/core/styles'

import useWallet from '../../../../hooks/useWallet'
import { useWrittenOptions } from '../../../../hooks/useWrittenOptions'
import useOpenPositions from '../../../../hooks/useOpenPositions'
import useOptionsMarkets from '../../../../hooks/useOptionsMarkets'
import { Heading } from '../Heading'
import { WrittenOptionRow } from './WrittenOptionRow'
import EmptySvg from '../EmptySvg'

// TODO handle the case where the writer has multiple underlying asset accounts
export const WrittenOptionsTable = React.memo(() => {
  const { connected } = useWallet()
  const theme = useTheme()
  const positions = useOpenPositions()
  const writtenOptions = useWrittenOptions()
  const { markets } = useOptionsMarkets()
  const nowInSeconds = Date.now() / 1000

  // TODO - Add user-configurable sort order
  // For now just sort by expiration to make sure the expired options are below the active ones
  const writtenOptionKeys = useMemo(
    () =>
      Object.keys(writtenOptions).sort((keyA, keyB) => {
        const marketA = markets[keyA]
        const marketB = markets[keyB]
        return marketB?.expiration - marketA?.expiration
      }),
    [writtenOptions, markets],
  )

  return (
    <Box
      w="100%"
      bgcolor={theme.palette.background.medium}
      style={{
        overflowX: 'auto',
      }}
    >
      <Box
        minWidth="880px"
        minHeight="514px"
        display="flex"
        flexDirection="column"
      >
        <Heading>Written Options</Heading>
        <Box
          display="flex"
          flexDirection="row"
          alignItems="flex-start"
          bgcolor={theme.palette.background.paper}
          p={1}
          fontSize={'14px'}
        >
          <Box p={1} pl={2} width="12%">
            Asset
          </Box>
          <Box p={1} width="8%">
            Type
          </Box>
          <Box p={1} width="10%">
            Strike ($)
          </Box>
          <Box p={1} width="10%">
            Locked Assets
          </Box>
          <Box p={1} width="10%">
            Contract Size
          </Box>
          <Box p={1} width="10%">
            Written
          </Box>
          <Box p={1} width="10%">
            Available
          </Box>
          <Box p={1} width="15%">
            Expiration
          </Box>
          <Box p={1} width="15%">
            Action
          </Box>
        </Box>
        {writtenOptionKeys.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            flexDirection="column"
            p={3}
            flexGrow="1"
          >
            <EmptySvg />
            <Box color={theme.palette.border.main}>
              {connected
                ? 'You have no written options'
                : 'Wallet not connected'}
            </Box>
          </Box>
        ) : (
          <Box>
            {writtenOptionKeys.map((marketKey) => {
              const market = markets[marketKey]
              const heldContracts = positions[marketKey]
                ? positions[marketKey].filter((position) => position.amount > 0)
                : []
              return (
                <WrittenOptionRow
                  expired={nowInSeconds > market.expiration}
                  key={marketKey}
                  marketKey={marketKey}
                  writerTokenAccounts={writtenOptions[marketKey]}
                  heldContracts={heldContracts}
                />
              )
            })}
          </Box>
        )}
      </Box>
    </Box>
  )
})
