import React, { memo, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import ArrowUpward from '@material-ui/icons/ArrowUpward'
import ArrowDownward from '@material-ui/icons/ArrowDownward'
import { useTheme } from '@material-ui/core/styles'
import {
  useUpdateForm,
  useFormState,
} from '../../../../context/SimpleUIContext'

import { SimpleUIPage } from '../SimpeUIPage'

const UpOrDownButton = ({ selected, onClick, direction }) => {
  const theme = useTheme()

  return (
    <Button
      style={{
        padding: 0,
        border: selected
          ? `1px solid ${theme.palette.primary.light}`
          : `1px solid rgba(139, 234, 255, 0)`,
        boxShadow: selected ? `inset 0 0 20px rgba(139, 234, 255, 0.25)` : '',
        background: 'rgba(255, 255, 255, 0.05)',
        width: '96px',
        height: '96px',
      }}
      onClick={onClick}
    >
      {direction === 'up' ? (
        <ArrowUpward
          style={{
            color: theme.palette.success.main,
            width: '48px',
            height: '48px',
          }}
        />
      ) : (
        <ArrowDownward
          style={{
            color: theme.palette.error.light,
            width: '48px',
            height: '48px',
          }}
        />
      )}
    </Button>
  )
}

const UpOrDown = () => {
  const { tokenSymbol } = useFormState()
  const updateForm = useUpdateForm()
  const history = useHistory()
  const [selectedDirection, setSelectedDirection] = useState('')

  // If previous form state didn't exist, send user back to first page (choose asset)
  useEffect(() => {
    if (!tokenSymbol) {
      history.replace('/simple/choose-asset')
    }
  }, [tokenSymbol, history])

  const handleMakeSelection = (direction) => {
    if (!selectedDirection) {
      setSelectedDirection(direction)
      updateForm('direction', direction === 'up' ? 'up' : 'down')

      // TODO: animated transition between pages instead of a timeout
      setTimeout(() => {
        history.push('/simple/choose-expiration')
      }, 500)
    }
  }

  return (
    <SimpleUIPage title={`I think it's going`}>
      <Box
        width="100%"
        px={2}
        py={1}
        flexDirection="row"
        display="flex"
        justifyContent="space-around"
      >
        <Box textAlign="center">
          <UpOrDownButton
            selected={selectedDirection === 'up'}
            direction="up"
            onClick={() => handleMakeSelection('up')}
          />
          <h3>Up</h3>
        </Box>
        <Box textAlign="center">
          <UpOrDownButton
            selected={selectedDirection === 'down'}
            direction="down"
            onClick={() => handleMakeSelection('down')}
          />
          <h3>Down</h3>
        </Box>
      </Box>
    </SimpleUIPage>
  )
}

export default memo(UpOrDown)
