import React from 'react';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import { useConnectedWallet } from '@saberhq/use-solana';
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext';
import { hasUnsettled } from '../../utils/hasUnsettled';

const MarketsUnsettledBalances: React.FC = () => {
  const wallet = useConnectedWallet();
  const { openOrdersBySerumMarket } = useSerumOpenOrders();

  const containsUnsettled = Object.values(openOrdersBySerumMarket)
    .map((orders) => {
      return hasUnsettled(orders);
    })
    .includes(true);

  if (!wallet?.connected || !containsUnsettled) {
    return null;
  }

  return (
    <Box alignItems={['right', 'right', 'center']} py={[2, 2, 0]}>
      <Box
        display="flex"
        flexDirection={['row', 'row', 'column']}
        alignItems="flex-start"
        fontSize={'14px'}
        px={[1, 1, 0]}
      >
        <Box px={[1, 1, 0]}>Unsettled Funds:</Box>
        <Box display="flex" px={[1, 1, 0]} pt={[0, 0, 1]}>
          <Box display="flex" flexDirection={'row'} alignItems="center" mr={1}>
            <span>You have&nbsp;</span>
            <Link
              href="#unsettled-balances-table"
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span>unsettled balances</span>
              <KeyboardArrowDown
                viewBox="0 0 24 24"
                style={{ width: '20px', height: '20px' }}
              />
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MarketsUnsettledBalances;
