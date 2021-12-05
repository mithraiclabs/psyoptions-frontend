import { BN } from '@project-serum/anchor';
import moment from 'moment';
import React, { useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  selectExpirationWithUnderlyingAmount,
  selectFutureExpirationsByUnderlyingAndQuote,
} from '../../recoil';
import { SelectBN } from '../Select';

const formatDate = (val: BN) =>
  `${moment(val.toNumber() * 1000)
    .utc()
    .format('LLL')} UTC`;

export const SelectExpiration: React.VFC = () => {
  const [_expirationUnixTimestamp, setExpiration] = useRecoilState(
    selectExpirationWithUnderlyingAmount,
  );
  const expirations = useRecoilValue(
    selectFutureExpirationsByUnderlyingAndQuote,
  );
  const onChange = useCallback(
    (e) => {
      setExpiration(new BN(e.target.value));
    },
    [setExpiration],
  );

  return (
    <SelectBN
      formControlOptions={{
        variant: 'filled',
        style: {
          minWidth: '100%',
        },
      }}
      formatOption={formatDate}
      label="Expiration Date"
      onChange={onChange}
      options={expirations}
      renderValue={formatDate}
      value={_expirationUnixTimestamp}
    />
  );
};
