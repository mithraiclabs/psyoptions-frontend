import React, { memo, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import Box from '@material-ui/core/Box';
import { Button } from '@material-ui/core';
import moment from 'moment';
import {
  useFormState,
} from '../../../../../context/SimpleUIContext';
import { SimpleUIPage } from '../../SimpeUIPage';
import OrderDetails from './OrderDetails';
import LabelledText from './LabelledText';

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

  const handlePlaceOrderClicked = () => {

  };

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
        <Box
          width='100%'
          py={2}
          flexDirection='column'
          display='flex'
        >
          <Box paddingBottom={1}>
            <LabelledText title={moment.unix(expirationUnixTimestamp).format('MMMM Do YYYY')} subtitle="Expiration" />
          </Box>
          <Box paddingBottom={1}>
            <LabelledText title={`$${strike.toString()}`} subtitle="Strike" />
          </Box>
        </Box>
        <Box
          width='100%'
          py={2}
          flexDirection='column'
          display='flex'
        >
          <Button
            color='primary'
            onClick={handlePlaceOrderClicked}
            variant='outlined'
            style={{ width: '100%' }}
          >
            Place Order
          </Button>
        </Box>
      </Box>
    </SimpleUIPage>
  );
};

export default memo(ConfirmOrder);
