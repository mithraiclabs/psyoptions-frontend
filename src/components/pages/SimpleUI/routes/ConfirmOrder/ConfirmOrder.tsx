import React, { memo, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import Box from '@material-ui/core/Box';
import {
  useFormState,
} from '../../../../../context/SimpleUIContext';
import { SimpleUIPage } from '../../SimpeUIPage';
import OrderDetails from './OrderDetails';

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
    <SimpleUIPage title={'Confirm Order'}>
      <Box
        width='100%'
        px={2}
        py={1}
        flexDirection='column'
        display='flex'
      >
        <OrderDetails
          side='buy'
          callOrPut={direction === 'up' ? 'call' : 'put'}
          contractSize={0.1}
          orderSize={orderSize}
        />
      </Box>
    </SimpleUIPage>
  );
};

export default memo(ConfirmOrder);
