import { BN } from '@project-serum/anchor';
import React, { useCallback, useMemo } from 'react';
import Select from './Select';

/**
 * Component for selecting supported contract sizes
 */
export const ContractSizeSelector: React.VFC<{
  decimals: number;
  options: BN[];
  onChange: (size: BN) => void;
  value: BN;
}> = ({ decimals, options, onChange, value }) => {
  const _options = useMemo(
    () =>
      options.map((s) => {
        const size = s.toNumber() * 10 ** -decimals;
        return {
          text: size.toString(),
          value: s,
        };
      }),
    [decimals, options],
  );
  const _onChange = useCallback(
    (e) => {
      onChange(e.value);
    },
    [onChange],
  );

  return (
    <Select
      disabled={!_options.length}
      formControlOptions={{
        variant: 'filled',
        style: {
          minWidth: '100%',
        },
      }}
      label="Contract Size"
      value={value}
      onChange={_onChange}
      options={_options}
    />
  );
};
