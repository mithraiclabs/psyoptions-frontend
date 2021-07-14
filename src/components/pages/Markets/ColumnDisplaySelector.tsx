import React, { useState, useReducer }from 'react'
import Popover from '@material-ui/core/Popover'
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import SettingsIcon from '@material-ui/icons/Settings'
import Button from '@material-ui/core/Button'
import FormGroup from '@material-ui/core/FormGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'
import { showColumnReducer, initialColumnState } from '../../../reducers/showColumnReducer'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formgroup: {
      padding: theme.spacing(2),
    },
  }),
);

export const ColumnDisplaySelector: React.FC = React.memo(() =>  {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [{
    showIV,
    showPriceChange,
    showVolume,
    showOI,
  }, dispatch] = useReducer(showColumnReducer, initialColumnState)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setState({ ...state, [event.target.name]: event.target.checked });
  // };

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
                  dispatch({ type: 'SET_SHOW_IV', payload: e.target.checked })
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
                  dispatch({ type: 'SET_SHOW_PRICE_CHANGE', payload: e.target.checked })
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
                  dispatch({ type: 'SET_SHOW_VOLUME', payload: e.target.checked })
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
                  dispatch({ type: 'SET_SHOW_OI', payload: e.target.checked })
                }}
                name="checkedOpenInterest"
                color="primary"
              />
            }
            label="Open Interest"
          />
        </FormGroup>
      </Popover>
    </div>
  );
})