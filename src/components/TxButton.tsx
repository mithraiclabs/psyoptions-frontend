import React from 'react'
import Box from '@material-ui/core/Box'
import Button, { ButtonProps } from '@material-ui/core/Button'
import CircularProgress from '@material-ui/core/CircularProgress'

type TxButtonProps = {
  loading: boolean
  children: React.ReactNode
} & ButtonProps

const TxButton = (props: TxButtonProps) => {
  const { disabled, loading, onClick, children } = props

  return (
    <Button
      {...props}
      disabled={disabled || loading}
      onClick={loading ? null : onClick}
    >
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="space-around"
        alignItems="center"
      >
        {children}
        {loading && (
          <CircularProgress
            style={{ width: '20px', height: '20px', marginLeft: '10px' }}
          />
        )}
      </Box>
    </Button>
  )
}

export default TxButton
