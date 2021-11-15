import { BN } from '@project-serum/anchor';
import moment from 'moment';
import React, { useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  expirationUnixTimestampBN,
  selectFutureExpirationsByUnderlyingAndQuote,
} from '../../recoil';
import { SelectBN } from '../Select';

const formatDate = (val: BN) =>
  `${moment(val.toNumber() * 1000).format('ll')} | 23:59:59 UTC`;

export const SelectExpiration: React.VFC = () => {
  const [_expirationUnixTimestamp, setExpiration] = useRecoilState(
    expirationUnixTimestampBN,
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
