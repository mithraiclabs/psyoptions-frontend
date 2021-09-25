import React, { memo } from 'react';
import { useRouter } from 'next/router';
import Box from '@material-ui/core/Box';
import { useTheme } from '@material-ui/core/styles';

const StepBar: React.VFC<{ on: boolean }> = ({ on }) => {
  const theme = useTheme();
  const { primary, background } = theme?.palette;

  return (
    <Box
      width="16%"
      height={'4px'}
      borderRadius={'2px'}
      bgcolor={on ? primary?.main : background?.light}
    />
  );
};

export const StepIndicator: React.FC = () => {
  const { pathname } = useRouter();

  let step = 1;
  if (pathname.match(/^\/simple\/up-or-down/)) {
    step = 2;
  }
  if (pathname.match(/^\/simple\/choose-expiration/)) {
    step = 3;
  }
  if (pathname.match(/^\/simple\/choose-strike/)) {
    step = 4;
  }
  if (pathname.match(/^\/simple\/order-settings/)) {
    step = 5;
  }
  if (pathname.match(/^\/simple\/confirm-order/)) {
    step = 6;
  }

  return (
    <Box
      p={2}
      pt={[3, 3, 5]}
      display="flex"
      justifyContent="space-between"
      flexDirection="row"
      width="100%"
      maxWidth="400px"
      mx={'auto'}
    >
      <StepBar on />
      <StepBar on={step > 1} />
      <StepBar on={step > 2} />
      <StepBar on={step > 3} />
      <StepBar on={step > 4} />
      <StepBar on={step > 5} />
    </Box>
  );
};

export default memo(StepIndicator);
