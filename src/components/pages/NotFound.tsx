import React from 'react';
import Box from '@material-ui/core/Box';
import Page from './Page';

const NotFound = () => (
  <Page>
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100%"
      margin="0 auto"
      pb={5}
    >
      <h1>404</h1>
      <h3>Looks like you&apos;re out of the money</h3>
    </Box>
  </Page>
);

export default NotFound;
