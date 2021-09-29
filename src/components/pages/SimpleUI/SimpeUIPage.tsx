import React from 'react';
import Box from '@material-ui/core/Box';

import type { ReactNode } from 'react';

import StatusBar from '../../StatusBar';
import Notifications from '../../Notifications';
import StepIndicator from './SimpleUIStepIndicator';

const pageBg =
  'linear-gradient(360deg, #42203B 14.41%, rgba(27, 26, 45, 0.81) 55.79%, #101017 93.84%), #101017';

type Props = {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
};

export const SimpleUIPage: React.FC<Props> = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <>
      <Notifications />
      <Box
        minHeight="100%"
        display="flex"
        flexDirection="column"
        style={{ background: pageBg }}
      >
        <StatusBar transparent />
        <StepIndicator />
        <Box maxWidth="400px" mx={'auto'} p={2}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <Box>{subtitle}</Box>
        </Box>
        <Box
          minHeight="100%"
          display="flex"
          flexDirection="column"
          flexGrow={1}
          justifyContent={'center'}
          width="100%"
          maxWidth="400px"
          mx="auto"
        >
          <Box
            display="flex"
            justifyContent={['flex-start', 'flex-start', 'center']}
            alignItems="center"
            flexDirection="column"
            minHeight="100%"
            pb={4}
            maxWidth={'400px'}
            width="100%"
            mx={'auto'}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </>
  );
};

// export default React.memo(SimpleUIPage)
