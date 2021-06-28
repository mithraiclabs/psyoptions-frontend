import React from 'react'
import Box from '@material-ui/core/Box'
import PropTypes from 'prop-types'
import { useTheme } from '@material-ui/core/styles'

export const Heading = ({ children }) => {
  const theme = useTheme()

  return (
    <Box p={2} textAlign="left">
      <h2
        style={{
          margin: '0',
          textTransform: 'none',
          color: theme.palette.primary.main,
        }}
      >
        {children}
      </h2>
    </Box>
  )
}

Heading.propTypes = {
  children: PropTypes.string.isRequired,
}
