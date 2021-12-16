import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import React from 'react';
import { THeadCell } from '../../Markets/styles';

export const ExpiredOpenOrdersTableHeader: React.VFC = () => {
  return (
    <TableHead>
      <TableRow>
        <THeadCell
          colSpan={10}
          style={{ borderTop: 'none', padding: '16px 20px' }}
        >
          <h3 style={{ margin: 0 }}>
            Expired Option Serum "OpenOrder" Accounts
          </h3>
        </THeadCell>
      </TableRow>
      <TableRow>
        <THeadCell>OpenOrder Address</THeadCell>
        <THeadCell>Serum Market Address</THeadCell>
        <THeadCell>Action</THeadCell>
      </TableRow>
    </TableHead>
  );
};
