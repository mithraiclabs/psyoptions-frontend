import {
  TableHead,
  TableRow,
} from "@material-ui/core";
import React from "react";
import useScreenSize from "../../../hooks/useScreenSize";
import { THeadCell } from "../../StyledComponents/Table/TableStyles";

const OpenPositionsTableHeader: React.VFC = () => {
  const { formFactor } = useScreenSize();

  return (
    <TableHead>
      <TableRow>
        <THeadCell
          colSpan={10}
          style={{ borderTop: 'none', padding: '16px 20px' }}
        >
          <h3 style={{ margin: 0 }}>Bought Options</h3>
        </THeadCell>
      </TableRow>
      <TableRow>
        { formFactor === 'desktop' ?
        <>
          <THeadCell>Asset</THeadCell>
          <THeadCell>Type</THeadCell>
          <THeadCell>Strike ($)</THeadCell>
          <THeadCell>Spot Price ($)</THeadCell>
          <THeadCell>Contract Size</THeadCell>
          <THeadCell>Position Size</THeadCell>
          <THeadCell>Expiration</THeadCell>
          <THeadCell>PNL</THeadCell>
          <THeadCell>Action</THeadCell>
        </> : 
        <>
          <THeadCell>Asset</THeadCell>
          <THeadCell>Expiration</THeadCell>
          <THeadCell>PNL</THeadCell>
          <THeadCell>Action</THeadCell>
        </>}
      </TableRow>
    </TableHead>
  );
};

export default OpenPositionsTableHeader;
