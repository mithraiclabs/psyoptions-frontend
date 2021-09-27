import React, { memo, useEffect, useState } from 'react';
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
import useFilteredOptionsChain from '../../../../../hooks/useFilteredOptionsChain';
import { calculateBreakevenForLimitOrder, calculateBreakevenForMarketOrder } from '../../../../../utils/calculateBreakeven';

const ConfirmOrder = () => {
  const history = useHistory();
  const { lowestAskHighestBidPerStrike, asksForStrike } = useFilteredOptionsChain();
  const [cost, setCost] = useState(null);
  const [breakeven, setBreakeven] = useState(null);
  const {
    tokenSymbol,
    direction,
    expirationUnixTimestamp,
    strike,
    orderSize,
    orderType,
    limitPrice,
    contractSize,
  } = useFormState();

  // If previous form state didn't exist, send user back to first page (choose asset)
  useEffect(() => {
    if (!tokenSymbol || !direction || !expirationUnixTimestamp || !strike ||
      !orderSize || !contractSize || (orderType === 'limit' && !limitPrice)) {
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
    contractSize,
    history,
  ]);

  useEffect(() => {
    if (orderType === 'limit') {
      setCost(limitPrice);
    } else if (lowestAskHighestBidPerStrike[strike]?.ask) {
      setCost(lowestAskHighestBidPerStrike[strike].ask);
    }
  }, [limitPrice, orderType, lowestAskHighestBidPerStrike, strike]);

  useEffect(() => {
    let newBreakevenPrice: number | null = null
    if (orderType === 'limit') {
      newBreakevenPrice = calculateBreakevenForLimitOrder(
        strike,
        contractSize,
        limitPrice,
        direction === 'down',
      );
    } else if (lowestAskHighestBidPerStrike[strike]?.ask) {
      newBreakevenPrice = calculateBreakevenForMarketOrder(
        strike,
        contractSize,
        orderSize,
        asksForStrike[strike] ?? [],
        direction === 'down',
      );
    }

    setBreakeven(newBreakevenPrice);
  }, [limitPrice, orderType, lowestAskHighestBidPerStrike, strike, contractSize, orderSize, direction, asksForStrike]);

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
          contractSize={contractSize}
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
          <Box paddingBottom={1}>
          <LabelledText title={cost ? `$${cost.toString()}` : '-'} subtitle="Cost" />
          </Box>
          <Box paddingBottom={1}>
            <LabelledText title={breakeven ? `$${breakeven.toString()}` : '-'} subtitle="Breakeven" />
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
