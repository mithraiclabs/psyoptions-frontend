import React from 'react'
import Box from '@material-ui/core/Box'
import StatusBar from '../StatusBar'
import Notifications from '../Notifications'
import Footer from '../Footer'

// Default page template
const Page: React.FC<{ background?: string; hideNavbar?: boolean }> = ({
  children,
  background,
  hideNavbar,
}) => (
  <>
    <Notifications />
    <Box
      minHeight="100%"
      display="flex"
      flexDirection="column"
      style={{ background }}
    >
      {hideNavbar ? null : <StatusBar />}
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

export default Page
