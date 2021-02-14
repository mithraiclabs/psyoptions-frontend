import React from 'react'
import StatusBar from '../StatusBar'

import Box from '@material-ui/core/Box'

// Default page template
const Page = ({ children }) => {
  return (
    <Box height="100%" display="flex" flexDirection="column">
      <StatusBar />
      <Box px={[1, 1, 4]} height="100%" display="flex" flexDirection="column">
        <Box p={2} height="100%">
          {children}
        </Box>
      </Box>
    </Box>
  )
}

export default Page
