import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import FilledInput, { FilledInputProps } from '@material-ui/core/FilledInput';
import withStyles from '@material-ui/core/styles/withStyles';
import React, { useCallback } from 'react';

const PlusMinusButton = withStyles({
  root: {
    borderRadius: 0,
    minWidth: '38px',
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    marginLeft: '2px',
    fontWeight: 700,
    fontSize: '24px',
    lineHeight: '24px',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
    },
  },
})(Button);

const StyledFilledInput = withStyles({
  root: {
    borderRadius: 0,
    width: '100%',
    minWidth: '100px',
  },
  input: {
    padding: '8px 12px !important',
  },
})(FilledInput);

interface PlusMinusIntegerInputProps
  extends Omit<FilledInputProps, 'onChange'> {
  onChange: (val: number | null) => void;
  value: number | null;
}

export const PlusMinusIntegerInput: React.VFC<PlusMinusIntegerInputProps> = ({
  onChange,
  value,
  ...passThruProps
}) => {
  const _onChange: React.ChangeEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = useCallback(
    (e) => {
      const parsedValue = parseInt(e.target.value, 10);
      let _value = parsedValue;
      if (Number.isNaN(parsedValue)) {
        _value = null;
      } else if (parsedValue < 1) {
        _value = 0;
      }
      onChange(_value);
    },
    [onChange],
  );
  const decrement = () => {
    onChange(value - 1);
  };
  const increment = () => {
    onChange(value + 1);
  };
  return (
    <Box pt={1} display="flex" flexDirection="row">
      <StyledFilledInput
        {...passThruProps}
        type="number"
        onChange={_onChange}
        value={value ?? ''}
      />
      <PlusMinusButton onClick={decrement}>-</PlusMinusButton>
      <PlusMinusButton onClick={increment}>+</PlusMinusButton>
    </Box>
  );
};
