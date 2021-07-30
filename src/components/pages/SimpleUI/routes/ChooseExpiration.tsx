import React, { memo, useEffect, useState } from 'react'
import { Switch, Route, useHistory, useLocation } from 'react-router-dom'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import ArrowUpward from '@material-ui/icons/ArrowUpward'
import ArrowDownward from '@material-ui/icons/ArrowDownward'
import { useTheme } from '@material-ui/core/styles'
import {
  useUpdateForm,
  useFormState,
} from '../../../../context/SimpleUIContext'

import { getSimpleUIExpirations } from '../../../../utils/dates'

const ChooseDateButton = ({ date, selected, onClick }) => {
  const theme = useTheme()

  return (
    <Button
      fullWidth
      style={{
        padding: 0,
        border: selected
          ? `1px solid ${theme.palette.primary.light}`
          : `1px solid rgba(139, 234, 255, 0)`,
        boxShadow: selected ? `inset 0 0 20px rgba(139, 234, 255, 0.25)` : '',
        background: 'rgba(255, 255, 255, 0.05)',
      }}
      onClick={onClick}
    >
      <Box
        width="100%"
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        p={1}
        color={theme?.palette?.primary?.light}
        fontSize={'16px'}
      >
        <Box p={1}>{`${date.format('MMMM Do YYYY, HH:mm:ss')} GMT`}</Box>
      </Box>
    </Button>
  )
}

const ChooseExpiration = () => {
  const { tokenSymbol, direction } = useFormState()
  const updateForm = useUpdateForm()
  const history = useHistory()
  const [selectedExpiration, setSelectedExpiration] = useState(0)

  const expirations = getSimpleUIExpirations()

  // If previous form state didn't exist, send user back to first page (choose asset)
  useEffect(() => {
    if (!tokenSymbol || !direction) {
      history.replace('/simple/choose-asset')
    }
  }, [tokenSymbol, direction, history])

  const handleMakeSelection = (expiration) => {
    if (!selectedExpiration) {
      setSelectedExpiration(expiration)
      updateForm('expirationUnixTimestamp', expiration)

      // TODO: animated transition between pages instead of a timeout
      setTimeout(() => {
        history.push('/simple/choose-strike')
      }, 500)
    }
  }

  return (
    <Box
      width="100%"
      px={2}
      py={1}
      flexDirection="column"
      display="flex"
      justifyContent="center"
    >
      {expirations.map((date) => (
        <Box my={1} key={date.unix()}>
          <ChooseDateButton
            date={date}
            onClick={() => handleMakeSelection(date.unix())}
            selected={selectedExpiration === date.unix()}
          />
        </Box>
      ))}
    </Box>
  )
}

export default memo(ChooseExpiration)
