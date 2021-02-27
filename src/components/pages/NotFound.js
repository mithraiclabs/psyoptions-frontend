import React from 'react'
import Page from './Page'
import { Box } from '@material-ui/core'

const NotFound = () => {
  return (
    <Page>
      <Box
        display="flex"
        flexDirection="column"
        justifyContent={'center'}
        alignItems={'center'}
        minHeight="100%"
        margin="0 auto"
        pb={5}
      >
        <h1>404</h1>
        <h3>Looks like you're out of the money</h3>
      </Box>
    </Page>
  )
}

export default NotFound
