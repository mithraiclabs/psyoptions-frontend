import React from 'react'
import Box from '@material-ui/core/Box'
import StatusBar from '../StatusBar'
import Notifications from '../Notifications'
import Footer from '../Footer'

// Default page template
const Page = ({ children, background }) => (
  <>
    <Notifications />
    <Box
      minHeight="100%"
      display="flex"
      flexDirection="column"
      style={{ background }}
    >
      <StatusBar />
      <Box
        px={[0, 0, 4]}
        minHeight="100%"
        display="flex"
        flexDirection="column"
        flexGrow={1}
        justifyContent="center"
      >
        <Box minHeight="100%">{children}</Box>
      </Box>
      <Footer />
    </Box>
  </>
)

export default React.memo(Page)
