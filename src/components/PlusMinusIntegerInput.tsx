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
  max?: number;
  min?: number;
  onChange: (val: number | null) => void;
  value: number | null;
}

const handleMinMax = (
  min: number | undefined,
  max: number | undefined,
  value: number,
): number => {
  let result = value;
  if (min) {
    result = Math.max(result, min);
  }
  if (max) {
    result = Math.min(result, max);
  }
  return result;
};

export const PlusMinusIntegerInput: React.VFC<PlusMinusIntegerInputProps> = ({
  max,
  min,
  onChange,
  value,
  ...passThruProps
}) => {
  const _onChange: React.ChangeEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = useCallback(
    (e) => {
      const parsedValue = parseInt(e.target.value, 10);
      let _value: number | null = parsedValue;
      if (Number.isNaN(parsedValue)) {
        _value = null;
      } else if (parsedValue < 1) {
        _value = 0;
      }
      onChange(_value == null ? null : handleMinMax(min, max, _value));
    },
    [max, min, onChange],
  );
  const decrement = () => {
    const newValue = (value ?? 0) - 1;
    onChange(handleMinMax(min, max, newValue));
  };
  const increment = () => {
    const newValue = (value ?? 0) + 1;
    onChange(handleMinMax(min, max, newValue));
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
