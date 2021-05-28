import React from 'react'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import NoSsr from '@material-ui/core/NoSsr'

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
