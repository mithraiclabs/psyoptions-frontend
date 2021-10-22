import Box from '@material-ui/core/Box';
import React from 'react';
import Page from '../src/components/pages/Page';

const Custom404: React.VFC = () => {
  return (
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
};

export default Custom404;
