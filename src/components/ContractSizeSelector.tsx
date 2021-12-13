import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import NoSsr from '@material-ui/core/NoSsr';
import Select from '@material-ui/core/Select';
import { BN } from '@project-serum/anchor';
import BigNumber from 'bignumber.js';
import React, { useCallback, useMemo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useTokenMintInfo } from '../hooks/useTokenMintInfo';
import {
  selectUnderlyingAmountPerOptionByExpirationUnderlyingQuote,
  underlyingAmountPerContract,
  underlyingMint,
} from '../recoil';

const BIGNUM_TEN = new BigNumber(10);

/**
 * Component for selecting supported contract sizes
 */
export const ContractSizeSelector: React.VFC = () => {
  const [contractSize, setContractSize] = useRecoilState(
    underlyingAmountPerContract,
  );
  const contractSizes = useRecoilValue(
    selectUnderlyingAmountPerOptionByExpirationUnderlyingQuote,
  );
  const _underlyingMint = useRecoilValue(underlyingMint);
  const underlyingMintInfo = useTokenMintInfo(_underlyingMint);
  const options = useMemo(
    () =>
      contractSizes.map((s) => {
        const sizeBigNum = new BigNumber(s.toString());
        const size = sizeBigNum.multipliedBy(
          BIGNUM_TEN.pow(
            new BigNumber(underlyingMintInfo?.decimals ?? 0).negated(),
          ),
        );
        return {
          text: size.toString(),
          value: s,
        };
      }),
    [contractSizes, underlyingMintInfo?.decimals],
  );
  const onChange = useCallback(
    (e) => {
      setContractSize(new BN(e.target.value));
    },
    [setContractSize],
  );

  return (
    <FormControl
      disabled={!options.length}
      style={{ minWidth: '100%' }}
      variant="filled"
    >
      <InputLabel id="Contract Size-label">Contract Size</InputLabel>
      <Select
        id="Contract Size-id"
        labelId="Contract Size-label"
        onChange={onChange}
        value={contractSize}
      >
        {options.map((option) => (
          <MenuItem
            key={option.text.toString()}
            value={option.value.toString()}
          >
            <NoSsr>{option.text}</NoSsr>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
