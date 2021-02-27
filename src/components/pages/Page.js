import React from 'react'
import Box from '@material-ui/core/Box'
import StatusBar from '../StatusBar'
import Notifications from '../Notifications'


// Default page template
const Page = ({ children }) => (
    <>
      <Notifications />
      <Box height="100%" display="flex" flexDirection="column">
        <StatusBar />
        <Box px={[0, 0, 4]} height="100%" display="flex" flexDirection="column">
          <Box height="100%">{children}</Box>
        </Box>
      </Box>
    </>
  )

export default React.memo(Page)
