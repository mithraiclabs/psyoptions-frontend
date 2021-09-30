import {
  Box,
  makeStyles,
  useMediaQuery
} from "@material-ui/core";
import React, { Fragment } from "react";
import clsx from "clsx";

const useStyles = makeStyles((theme) => ({
  root: {},
}));

const OpenPositionsTableHeader: React.VFC<{ className: any }> = ({ className }) => {
  const classes = useStyles();
  const mobileDevice = !useMediaQuery("(min-width:375px)");
  const tabletDevice = !useMediaQuery("(min-width:880px)");

  return (
    <Box className={clsx(classes.root, className)}>
      <Box>
        Asset
      </Box>
      {(!mobileDevice && !tabletDevice) && <Fragment>
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
