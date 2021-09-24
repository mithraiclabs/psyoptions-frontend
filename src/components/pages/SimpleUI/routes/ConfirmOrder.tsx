import React, { memo, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  useFormState,
} from '../../../../context/SimpleUIContext';
import { SimpleUIPage } from '../SimpeUIPage';

const ConfirmOrder = () => {
  const history = useHistory();
  const {
    tokenSymbol,
    direction,
    expirationUnixTimestamp,
    strike,
    orderSize,
    orderType,
    limitPrice,
  } = useFormState();

  // If previous form state didn't exist, send user back to first page (choose asset)
  useEffect(() => {
    if (!tokenSymbol || !direction || !expirationUnixTimestamp || !strike ||
      !orderSize || (orderType === 'limit' && !limitPrice)) {
      history.replace('/simple/choose-asset');
    }
  }, [
    tokenSymbol,
    direction,
    expirationUnixTimestamp,
    strike,
    orderSize,
    orderType,
    limitPrice,
    history,
  ]);

  return (
    <SimpleUIPage title={'Confirm Order'} />
  );
};

export default memo(ConfirmOrder);
