import React from 'react';
import Box from '@material-ui/core/Box';
import { useTheme } from '@material-ui/core/styles';
import LabelledText from './LabelledText';

const OrderDetailBox: React.VFC<{
  title: string;
  subtitle: string;
  titleColor?: string | null;
}> = ({
  title,
  subtitle,
  titleColor,
}) => {

  return (
    <Box
      width='100%'
      display='flex'
      flexDirection='column'
      textAlign='left'
      bgcolor='rgba(255, 255, 255, 0.08)'
      borderRadius='4px'
      padding='8px 16px 8px 16px'
    >
      <LabelledText title={title} subtitle={subtitle} titleColor={titleColor} />
    </Box>
  );
};

const OrderDetails: React.VFC<{
  side: 'buy' | 'sell';
  callOrPut: 'call' | 'put';
  contractSize: number;
  orderSize: number;
}> = ({
  side,
  callOrPut,
  contractSize,
  orderSize,
}) => {
  const theme = useTheme();

  return (
    <Box
      width='100%'
      display='flex'
      flexDirection='column'
    >
      <Box
        width='100%'
        display='flex'
        flexDirection='row'
        paddingBottom='8px'
      >
        <div style={{ width: '100%', paddingRight: '8px' }}>
          <OrderDetailBox
            title={side.toUpperCase()}
            subtitle='Side'
            titleColor={side === 'buy' ? theme.palette.success.main : theme.palette.error.main}
          />
        </div>
        <OrderDetailBox title={callOrPut.toUpperCase()} subtitle='Type' />
      </Box>
      <Box
        width='100%'
        display='flex'
        flexDirection='row'
      >
        <div style={{ width: '100%', paddingRight: '8px' }}>
          <OrderDetailBox title={contractSize.toString()} subtitle='Contract Size' />
        </div>
        <OrderDetailBox title={orderSize.toString()} subtitle='Order Size' />
      </Box>
    </Box>
  );
};

export default OrderDetails;
