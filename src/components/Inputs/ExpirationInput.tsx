import DateFnsUtils from '@date-io/date-fns';
import Box from '@material-ui/core/Box';
import { KeyboardDatePicker } from '@material-ui/pickers/DatePicker';
import MuiPickersUtilsProvider from '@material-ui/pickers/MuiPickersUtilsProvider';
import { MaterialUiPickersDate } from '@material-ui/pickers/typings/date';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import React from 'react';
import theme from '../../utils/theme';
import { StyledTooltip } from '../Markets/styles';
import { Moment } from 'moment';

const darkBorder = `1px solid ${theme.palette.background.main}`;

export const ExpirationInput: React.VFC<{
  onChange: (
    date: MaterialUiPickersDate,
    value?: string | null | undefined,
  ) => void;
  value: Date | Moment;
}> = ({ onChange, value }) => {
  return (
    <Box p={2} borderBottom={darkBorder} display="flex" alignItems="center">
      Expires On:
      <Box
        display="flex"
        flexWrap="wrap"
        flexDirection="row"
        alignItems="center"
      >
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <KeyboardDatePicker
            autoOk
            disablePast
            variant="inline"
            format="MM/dd/yyyy"
            inputVariant="filled"
            id="date-picker-inline"
            label="MM/DD/YYYY"
            value={value}
            onChange={onChange}
            KeyboardButtonProps={{
              'aria-label': 'change date',
            }}
            style={{ marginLeft: theme.spacing(4) }}
          />
        </MuiPickersUtilsProvider>
        <StyledTooltip
          title={
            <Box p={1}>
              All expirations occur at 23:59:59 UTC on any selected date.
            </Box>
          }
        >
          <Box p={2}>
            <HelpOutlineIcon />
          </Box>
        </StyledTooltip>
      </Box>
    </Box>
  );
};
