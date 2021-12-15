import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import React from 'react';
import { useRecoilValue } from 'recoil';
import useScreenSize from '../../../hooks/useScreenSize';
import { selectOpenOrdersForExpiredOptions } from '../../../recoil';
import { THeadCell } from '../../Markets/styles';

export const ExpiredOpenOrdersTableHeader: React.VFC = () => {
  const { formFactor } = useScreenSize();

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
      {/* <TableRow>
        {formFactor === 'desktop' ? (
          <>
            <THeadCell>Asset</THeadCell>
            <THeadCell>Type</THeadCell>
            <THeadCell>Strike ($)</THeadCell>
            <THeadCell>Available</THeadCell>
            <THeadCell>Contract Size</THeadCell>
            <THeadCell>Written</THeadCell>
            <THeadCell>Expiration</THeadCell>
            <THeadCell>Locked Assets</THeadCell>
            <THeadCell>Action</THeadCell>
          </>
        ) : (
          <>
            <THeadCell>Asset</THeadCell>
            <THeadCell>Expiration</THeadCell>
            <THeadCell>Locked Assets</THeadCell>
            <THeadCell>Action</THeadCell>
          </>
        )}
      </TableRow> */}
    </TableHead>
  );
};
