import React, { memo, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Box from '@material-ui/core/Box';
import Chip from '@material-ui/core/Chip';
import Button from '@material-ui/core/Button';
import Done from '@material-ui/icons/Done';
import { useTheme } from '@material-ui/core/styles';
import {
  useUpdateForm,
  useFormState,
} from '../../../../context/SimpleUIContext';
import useAssetList from '../../../../hooks/useAssetList';
import useFilteredOptionsChain from '../../../../hooks/useFilteredOptionsChain';
import { StyledFilledInput, PlusMinusButton } from '../../../BuySellDialog/styles';
import { SimpleUIPage } from '../SimpeUIPage';
import ChooseStrikeButton from './ChooseStrike/ChooseStrikeButton';

// #TODO: Make this a global enum, i see BuySellDialog.tsx is using it
const orderTypes = ['limit', 'market'];

const OrderSettings = () => {
  const { tokenSymbol, direction, expirationUnixTimestamp, strike } = useFormState();
  const updateForm = useUpdateForm();
  const history = useHistory();
  const theme = useTheme();
  const { qAsset } = useAssetList();
  const [limitPrice, setLimitPrice] = useState(0);
  const [orderType, setOrderType] = useState('limit');
  const [orderSize, setOrderSize] = useState(1);
  const { lowestAskHighestBidPerStrike, setDirection } = useFilteredOptionsChain();

  // If previous form state didn't exist, send user back to first page (choose asset)
  useEffect(() => {
    if (!tokenSymbol || !direction || !expirationUnixTimestamp || !strike) {
      history.replace('/simple/choose-asset');
    }
  }, [tokenSymbol, direction, expirationUnixTimestamp, strike, history]);

  useEffect(() => {
    setDirection(direction);
  }, [direction, setDirection]);

  const handleChangeOrderSize = (e) => setOrderSize(e.target.value);
  const handleChangeLimitPrice = (e) => setLimitPrice(e.target.value);

  const handleReviewClicked = () => {
    updateForm('orderSize', orderSize);
    updateForm('orderType', orderType);
    updateForm('limitPrice', limitPrice);
    
    // TODO: animated transition between pages instead of a timeout
    setTimeout(() => {
    history.push('/simple/confirm-order');
    }, 500);
  };

  return (
    <SimpleUIPage title={`Order Settings`}>
      <Box
        width='100%'
        px={2}
        py={1}
        flexDirection='column'
        display='flex'
        justifyContent='center'
      >
        <Box
          width='100%'
          paddingBottom={3}
        >
          <ChooseStrikeButton
            strike={strike.toString()}
            bid={lowestAskHighestBidPerStrike[strike]?.bid}
            ask={lowestAskHighestBidPerStrike[strike]?.ask}
            selected
            onClick={null}
            disabled
          />
        </Box>
        <Box pb={1} pt={2}>
          Order Quantity:
          <Box pt={1} display='flex' flexDirection='row'>
            <StyledFilledInput
              value={orderSize}
              type='number'
              onChange={handleChangeOrderSize}
              onBlur={() => {
                if (!orderSize) {
                  setOrderSize(1);
                }
              }}
            />
            <PlusMinusButton
              onClick={() =>
                setOrderSize(Math.max(1, orderSize - 1))
              }
            >
              -
            </PlusMinusButton>
            <PlusMinusButton
              onClick={() => setOrderSize(orderSize + 1)}
            >
              +
            </PlusMinusButton>
          </Box>
        </Box>
        <Box pb={1} pt={2}>
          Order Type:
          <Box pt={1}>
            {orderTypes.map((_type) => {
              const selected = _type === orderType;
              return (
                <Chip
                  key={_type}
                  clickable
                  size='small'
                  label={_type}
                  color='primary'
                  onClick={() => setOrderType(_type)}
                  onDelete={
                    selected ? () => setOrderType(_type) : undefined
                  }
                  variant={selected ? undefined : 'outlined'}
                  deleteIcon={selected ? <Done /> : undefined}
                  style={{
                    marginRight: theme.spacing(2),
                    minWidth: '98px',
                    fontSize: '14px',
                  }}
                />
              );
            })}
          </Box>
        </Box>
        <Box
          pb={1}
          pt={2}
          color={
            orderType === 'market'
              ? theme.palette.background.lighter
              : theme.palette.primary.main
          }
        >
          Limit Price ({qAsset?.tokenSymbol ?? '-'}):
          <Box pt={1}>
            <StyledFilledInput
              type='number'
              value={orderType === 'market' ? '' : limitPrice}
              onChange={handleChangeLimitPrice}
              disabled={orderType === 'market'}
            />
          </Box>
        </Box>
        <Box
          width='100%'
          paddingTop={3}
        >
          <Button
            color='primary'
            onClick={handleReviewClicked}
            variant='outlined'
            disabled={orderType === 'limit' && !limitPrice}
            style={{ width: '100%' }}
          >
            Review your order
          </Button>
        </Box>
      </Box>
    </SimpleUIPage>
  );
};

export default memo(OrderSettings);
