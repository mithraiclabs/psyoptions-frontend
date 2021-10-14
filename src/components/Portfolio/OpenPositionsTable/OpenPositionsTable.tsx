import React, { memo, useState } from 'react';
import {
  Box,
  TableContainer,
  TableRow,
  TableBody,
  Table,
} from "@material-ui/core";
import useWallet from '../../../hooks/useWallet';
import OpenPositionsTableHeader from './OpenPositionsTableHeader';
import PositionRow from './PositionRow';
import { Position } from '../Portfolio';
import { TCell } from '../../StyledComponents/Table/TableStyles';
import ConnectButton from '../../ConnectButton';

// TODO handle the case where the writer has multiple underlying asset accounts
const OpenPositionsTable: React.VFC<{
  positions: Position[];
  className: string;
}> = ({ className, positions }) => {
  const { connected } = useWallet();
  const [page] = useState(0);
  const [rowsPerPage] = useState(10);

  return (
    <Box>
      <TableContainer>
        <Table stickyHeader aria-label="sticky table">
          <OpenPositionsTableHeader />
          <TableBody>
            {!connected ? (
              <TableRow>
                <TCell align="center" colSpan={10}>
                  <Box p={1}>
                    <ConnectButton>Connect Wallet</ConnectButton>
                  </Box>
                </TCell>
              </TableRow>
            ) : (
              positions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <PositionRow
                  key={row.market.optionMintKey.toString()}
                  row={row}
                  className={className}
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