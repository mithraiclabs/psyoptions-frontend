import React, { memo, useMemo } from 'react';
import {
  Box,
  TableContainer,
  TableRow,
  TableBody,
  Table,
  makeStyles,
} from '@material-ui/core';
import { useConnectedWallet } from '@saberhq/use-solana';
import { useWrittenOptions } from '../../../hooks/useWrittenOptions';
import WrittenOptionRow from './WrittenOptionRow';
import WrittenOptionsTableHeader from './WrittenOptionsTableHeader';
import { TCell } from '../../StyledComponents/Table/TableStyles';
import GokiButton from '../../GokiButton';
import CSS from 'csstype';
import { PublicKey } from '@solana/web3.js';

const useStyles = makeStyles((theme) => ({
  walletButtonCell: {
    textAlign: '-webkit-center' as CSS.Property.TextAlign,
  },
}));

// TODO handle the case where the writer has multiple underlying asset accounts
const WrittenOptionsTable: React.VFC = () => {
  const classes = useStyles();
  const wallet = useConnectedWallet();
  const writtenOptions = useWrittenOptions();

  const writtenOptionKeys = useMemo(
    () => Object.keys(writtenOptions).map((key) => new PublicKey(key)),
    [writtenOptions],
  );

  return (
    <Box style={{ zIndex: 1 }}>
      <TableContainer>
        <Table stickyHeader aria-label="sticky table">
          <WrittenOptionsTableHeader />
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
              <>
                {writtenOptionKeys.map((optionKey) => (
                  <WrittenOptionRow optionKey={optionKey} />
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default memo(WrittenOptionsTable);
