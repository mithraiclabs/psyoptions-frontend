import {
  Box,
  makeStyles,
} from "@material-ui/core";
import React, { Fragment } from "react";
import clsx from "clsx";

const useStyles = makeStyles((theme) => ({
  root: {},
}));

const OpenPositionsTableHeader: React.VFC<{
  className: string;
  formFactor: "desktop" | "tablet" | "mobile";
}> = ({ className, formFactor }) => {
  const classes = useStyles();

  return (
    <Box className={clsx(classes.root, className)}>
      <Box pl={formFactor === "mobile" ? 2 : 0}>
        Asset
      </Box>
      {formFactor === "desktop" && <Fragment>
        <Box>
          Type
        </Box>
        <Box>
          Strike ($)
        </Box>
        <Box>
          Spot Price ($)
        </Box>
        <Box>
          Contract Size
        </Box>
        <Box>
          Position Size
        </Box>
      </Fragment>}
      <Box>
        Expiration
      </Box>
      <Box>
        PNL
      </Box>
      <Box textAlign="left">
        Action
      </Box>
    </Box>
  );
};

export default OpenPositionsTableHeader;
