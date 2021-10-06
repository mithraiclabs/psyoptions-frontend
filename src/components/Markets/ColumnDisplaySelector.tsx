import React, { useState } from 'react';
import Popover from '@material-ui/core/Popover';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import SettingsIcon from '@material-ui/icons/Settings';
import Button from '@material-ui/core/Button';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formgroup: {
      padding: theme.spacing(2),
    },
  }),
);

export const ColumnDisplaySelector: React.FC<{
  showIV: boolean;
  showPriceChange: boolean;
  showVolume: boolean;
  showOI: boolean;
  showLastPrice: boolean;
  setShowIV: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPriceChange: React.Dispatch<React.SetStateAction<boolean>>;
  setShowVolume: React.Dispatch<React.SetStateAction<boolean>>;
  setShowOI: React.Dispatch<React.SetStateAction<boolean>>;
  setShowLastPrice: React.Dispatch<React.SetStateAction<boolean>>;
  currentColumnsCount: number;
  setColumnsCount: (num: number) => void;
}> = ({
  showIV,
  showPriceChange,
  showVolume,
  showOI,
  showLastPrice,
  setShowIV,
  setShowPriceChange,
  setShowVolume,
  setShowOI,
  setShowLastPrice,
  currentColumnsCount,
  setColumnsCount,
}) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'column-display-selector' : undefined;

  return (
    <div>
      <Button onClick={handleClick}>
        <SettingsIcon />
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <FormGroup className={classes.formgroup}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showIV} // true or false
                onChange={(e) => {
                  setShowIV(e.target.checked);
                  if (e.target.checked) {
                    setColumnsCount(currentColumnsCount + 4);
                  } else {
                    setColumnsCount(currentColumnsCount - 4);
                  }
                }}
                name="checkedIV"
                color="primary"
              />
            }
            label="IV"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showPriceChange}
                onChange={(e) => {
                  setShowPriceChange(e.target.checked);
                  if (e.target.checked) {
                    setColumnsCount(currentColumnsCount + 2);
                  } else {
                    setColumnsCount(currentColumnsCount - 2);
                  }
                }}
                name="checkedChange"
                color="primary"
              />
            }
            label="Change"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showVolume}
                onChange={(e) => {
                  setShowVolume(e.target.checked);
                  if (e.target.checked) {
                    setColumnsCount(currentColumnsCount + 2);
                  } else {
                    setColumnsCount(currentColumnsCount - 2);
                  }
                }}
                name="checkedVolume"
                color="primary"
              />
            }
            label="Volume"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showOI}
                onChange={(e) => {
                  setShowOI(e.target.checked);
                  if (e.target.checked) {
                    setColumnsCount(currentColumnsCount + 2);
                  } else {
                    setColumnsCount(currentColumnsCount - 2);
                  }
                }}
                name="checkedOpenInterest"
                color="primary"
              />
            }
            label="Open Interest"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showLastPrice}
                onChange={(e) => {
                  setShowLastPrice(e.target.checked);
                  if (e.target.checked) {
                    setColumnsCount(currentColumnsCount + 2);
                  } else {
                    setColumnsCount(currentColumnsCount - 2);
                  }
                }}
                name="checkedLastPrice"
                color="primary"
              />
            }
            label="Last Price"
          />
        </FormGroup>
      </Popover>
    </div>
  );
};
