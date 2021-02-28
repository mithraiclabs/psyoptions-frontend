import React from 'react'
import Box from '@material-ui/core/Box'
import PropTypes from 'prop-types'
import theme from '../../../utils/theme'

const darkBorder = `1px solid ${theme.palette.background.main}`

export const Heading = ({ children }) => (
  <Box borderBottom={darkBorder} p={2} textAlign="center">
    <h2 style={{ margin: '10px 0 0' }}>{children}</h2>
  </Box>
)

Heading.propTypes = {
  children: PropTypes.string.isRequired,
}
