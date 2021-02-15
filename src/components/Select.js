import React from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
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
        {options.map((value) => (
          <MenuItem key={value} value={value}>
            {value}
          </MenuItem>
        ))}
      </Select>
      {/* <FormHelperText>TODO: Error Message</FormHelperText> */}
    </FormControl>
  )
}

export default Sel
