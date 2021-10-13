import {
  Box,
  makeStyles,
} from "@material-ui/core";
import React, { Fragment } from "react";
import clsx from "clsx";
import useScreenSize from "../../../hooks/useScreenSize";

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    padding: "20px",
    fontSize: "14px",
  },
  mobile: {
    fontSize: "12px !important",
  },
}));

const OpenPositionsTableHeader: React.VFC<{
  className: string;
}> = ({ className }) => {
  const classes = useStyles();
  const { formFactor } = useScreenSize();

  return (
    <Box className={clsx(
      classes.root,
      className,
      formFactor === "mobile" && classes.mobile
    )}>
      <Box pl={formFactor === "mobile" ? 2 : formFactor === "tablet" ? 6 : 0}>
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
      <Box pl={formFactor === "mobile" ? 2 : 6}>
        Action
      </Box>
    </Box>
  );
};

export default OpenPositionsTableHeader;
