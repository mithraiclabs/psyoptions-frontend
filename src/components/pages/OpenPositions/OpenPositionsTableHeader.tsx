import {
  Box,
  makeStyles,
  useMediaQuery
} from '@material-ui/core';
import React from 'react';
import clsx from 'clsx';

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    bgcolor: theme.palette.background.paper,
    p: 1,
    fontSize: '14px'
  },
  tablet: {
    fontSize: '10px'
  },
  mobile: {
    fontSize: '10px'
  },
}));

const OpenPositionsTableHeader: React.VFC = () => {
  const classes = useStyles();
  const mobileDevice = !useMediaQuery('(min-width:375px)');
  const tabletDevice = !useMediaQuery('(min-width:880px)');

  return (
    <Box className={clsx(classes.root, mobileDevice && classes.mobile, tabletDevice && classes.tablet)}>
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
  );
};

export default OpenPositionsTableHeader;
