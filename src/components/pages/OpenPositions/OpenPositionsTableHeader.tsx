import Box from '@material-ui/core/Box';
import React from 'react';
import { useTheme } from '@material-ui/core/styles';

const OpenPositionsTableHeader: React.VFC = () => {
  const theme = useTheme();

  return (
    <>
      <Box
        display="flex"
        flexDirection="row"
        alignItems="flex-start"
        bgcolor={theme.palette.background.paper}
        p={1}
        fontSize={'14px'}
      >
        <Box p={1} pl={2} width="12%">
          Asset
        </Box>
        <Box p={1} width="8%">
          Type
        </Box>
        <Box p={1} width="10%">
          Strike ($)
        </Box>
        <Box p={1} width="10%">
          Spot Price ($)
        </Box>
        <Box p={1} width="10%">
          Contract Size
        </Box>
        <Box p={1} width="10%">
          Position Size
        </Box>
        <Box p={1} width="16%">
          Expiration
        </Box>
        <Box p={1} width="9%">
          PNL
        </Box>
        <Box p={1} width="10%" textAlign="left">
          Action
        </Box>
        <Box width="5%" p={1} pr={2} />
      </Box>
    </>
  );
};

export default OpenPositionsTableHeader;
