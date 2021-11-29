import React, { memo, useMemo, useState } from 'react';
import {
  Box,
  TableContainer,
  TableRow,
  TableBody,
  Table,
  makeStyles,
} from '@material-ui/core';
import { useConnectedWallet } from '@saberhq/use-solana';
import OpenPositionsTableHeader from './OpenPositionsTableHeader';
import PositionRow from './PositionRow';
import { TCell } from '../../StyledComponents/Table/TableStyles';
import GokiButton from '../../GokiButton';
import CSS from 'csstype';
import useOpenPositions from '../../../hooks/useOpenPositions';
import { PublicKey } from '@solana/web3.js';

const useStyles = makeStyles(() => ({
  walletButtonCell: {
    textAlign: '-webkit-center' as CSS.Property.TextAlign,
  },
}));

const OpenPositionsTable: React.VFC<{
  className: string;
}> = ({ className }) => {
  const positions = useOpenPositions();
  const classes = useStyles();
  const wallet = useConnectedWallet();
  const [page] = useState(0);
  const [rowsPerPage] = useState(10);
  const positionsList = useMemo(
    () =>
      Object.keys(positions).map((key) => ({
        accounts: positions[key],
        optionKey: new PublicKey(key),
      })),
    [positions],
  );

  return (
    <Box style={{ zIndex: 1 }}>
      <TableContainer>
        <Table stickyHeader aria-label="sticky table">
          <OpenPositionsTableHeader />
          <TableBody>
            {!wallet?.connected ? (
              <TableRow>
                <TCell
                  align="center"
                  colSpan={10}
                  className={classes.walletButtonCell}
                >
                  <Box p={1}>
                    <GokiButton />
                  </Box>
                </TCell>
              </TableRow>
            ) : (
              positionsList
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((position) => (
                  <PositionRow
                    accounts={position.accounts}
                    key={position.optionKey.toString()}
                    className={className}
                    optionKey={position.optionKey}
                  />
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default memo(OpenPositionsTable);
