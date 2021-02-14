import React from 'react'
import StatusBar from '../StatusBar'

import Box from '@material-ui/core/Box'

// Default page template
const Page = ({ children }) => {
  return (
    <Box>
      <StatusBar />
      <Box p={[1, 1, 4]} display="flex">
        <Box p={2}>{children}</Box>
      </Box>
    </Box>
  )
}

export default Page
