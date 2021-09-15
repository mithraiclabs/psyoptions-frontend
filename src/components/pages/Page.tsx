import React from 'react';
import Box from '@material-ui/core/Box';
import StatusBar from '../StatusBar';
import Notifications from '../Notifications';
import Footer from '../Footer';
import Disclaimer from '../Disclaimer';

// Default page template
const Page: React.FC<{
  children: React.ReactNode;
  background?: string;
  hideNavbar?: boolean;
  transparentNavbar?: boolean;
  center?: boolean;
}> = ({
  children,
  background,
  hideNavbar,
  transparentNavbar = false,
  center = true,
}) => (
  <>
    <Notifications />
    <Box
      minHeight="100%"
      display="flex"
      flexDirection="column"
      style={{ background }}
    >
      {hideNavbar ? null : <StatusBar transparent={transparentNavbar} />}
      <Box
        px={[0, 0, 2]}
        minHeight="100%"
        display="flex"
        flexDirection="column"
        flexGrow={1}
        justifyContent={center ? 'center' : 'flex-start'}
      >
        <Box minHeight="100%">{children}</Box>
      </Box>
      <Disclaimer />
      <Footer />
    </Box>
  </>
);

export default React.memo(Page);
