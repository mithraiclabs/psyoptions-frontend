import React, { memo, useState } from 'react';
import {
  Box,
  makeStyles,
} from "@material-ui/core";
import useWallet from '../../../../hooks/useWallet';
import { Heading } from '../Heading';
import EmptySvg from '../EmptySvg';
import OpenPositionsTableHeader from './OpenPositionsTableHeader';
import PositionRow from './PositionRow';
import { Position } from '../OpenPositions';

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    backgroundColor: theme.palette.background.medium,
    minHeight: "514px",
  },
  emptySVGContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    padding: theme.spacing(3),
    flexGrow: 1,
  },
  mainColor: {
    color: theme.palette.border.main,
  },
}));

// TODO handle the case where the writer has multiple underlying asset accounts
const OpenPositionsTable: React.VFC<{
  positions: Position[];
  className: string;
  formFactor: "desktop" | "tablet" | "mobile";
}> = ({ className, positions, formFactor }) => {
  const classes = useStyles();
  const { connected } = useWallet();
  const [page] = useState(0);
  const [rowsPerPage] = useState(10);

  const hasOpenPositions = positions.length > 0;

  return (
    <Box className={classes.root}>
      <Heading>Open Positions</Heading>
      <OpenPositionsTableHeader
        formFactor={formFactor}
        className={className}
      />
      {hasOpenPositions && connected ? (
        positions
          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((row) => (
            <PositionRow
              key={row.market.optionMintKey.toString()}
              row={row}
              formFactor={formFactor}
              className={className}
            />
          ))
      ) : (
        <Box className={classes.emptySVGContainer}>
          <EmptySvg />
          <Box className={classes.mainColor}>
            {connected
              ? 'You have no open positions'
              : 'Wallet not connected'}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default memo(OpenPositionsTable);