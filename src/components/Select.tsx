import React, { ChangeEvent } from 'react';
import FormControl, { FormControlProps } from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import NoSsr from '@material-ui/core/NoSsr';

type Option = {
  value: string | number;
  text: string;
};

const Sel: React.FC<{
  disabled?: boolean;
  label: string;
  value: string | number;
  onChange: (
    event: ChangeEvent<{ name?: string; value: Option['value'] }>,
  ) => void;
  options: Option[];
  formControlOptions?: FormControlProps;
}> = ({ disabled, label, value, onChange, options, formControlOptions }) => {
  return (
    <FormControl disabled={disabled} {...formControlOptions}>
      <InputLabel id={`${label}-label`}>{label}</InputLabel>
      <Select
        labelId={`${label}-label`}
        id={`${label}-select`}
        value={value}
        onChange={onChange}
      >
        {options
          ? options.map((option) => (
              <MenuItem key={option.text} value={option.value}>
                <NoSsr>{option.text}</NoSsr>
              </MenuItem>
            ))
          : null}
      </Select>
      {/* <FormHelperText>TODO: Error Message</FormHelperText> */}
    </FormControl>
  );
};

export default Sel;
