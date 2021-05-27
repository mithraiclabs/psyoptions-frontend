import React from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  NoSsr,
} from '@material-ui/core'

const Sel = (props) => {
  const { disabled, label, value, onChange, options } = props
  return (
    <FormControl disabled={disabled} {...props}>
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
  )
}

export default Sel
