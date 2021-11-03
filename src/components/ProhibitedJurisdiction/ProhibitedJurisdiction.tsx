import React from 'react';
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import Page from '../pages/Page';
import theme from '../../utils/theme';

const useStyles = makeStyles({
  logoH1: {
    margin: 0,
    textTransform: 'none',
    textShadow: 'none',
    background: `linear-gradient(269.9deg, ${theme.palette.warning.main} 0.1%, ${theme.palette.success.main} 50.52%, ${theme.palette.primary.main} 97.89%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontSize: 'inherit',
  },
});

const pageBg =
  'linear-gradient(0deg, rgba(66, 32, 59, 1) 0%, rgba(27, 26, 45, 1) 35%, rgba(16, 16, 23, 1) 70%)';

const ProhibitedJurisdiction: React.VFC = () => {
  const { logoH1 } = useStyles();

  return (
    <Page background={pageBg} hideNavbar>
      <Box
        display="flex"
        justifyContent="center"
        flexDirection="column"
        minHeight="100%"
        pb={4}
      >
        <Box
          display="flex"
          flexDirection={'column'}
          alignItems="center"
          justifyContent="center"
          mt={2}
          p={3}
        >
          <Box
            display="flex"
            flexDirection={'row'}
            alignItems="center"
            justifyContent="center"
          >
            <img
              width="95px"
              height="95px"
              src="images/psyoptions-logo-light.png"
              alt="PsyOptions Logo"
            />
            <Box px={[1, 1, 3]} fontSize={['48px', '48px', '60px', '72px']}>
              <h1 className={logoH1}>PsyOptions</h1>
            </Box>
          </Box>
          <Box
            px={[1, 1, 3]}
            fontSize={['24px', '24px', '24px', '32px']}
            mt={4}
          >
            <h1 style={{ textAlign: 'center', margin: '5px 0' }}>
              Prohibited Jurisdiction 😭
            </h1>
            <h6>
              Due to regulations, this website is not available to residents of Belarus, the Central
              African Republic, the Democratic Republic of Congo, the Democratic
              People&lsquo;s Republic of Korea, the Crimea region of Ukraine,
              Cuba, Iran, Libya, Somalia, Sudan, South Sudan, Syria, Thailand,
              the UK, the USA, Yemen, Zimbabwe, and any other jurisdiction in
              which accessing or using this website is prohibited.
            </h6>
          </Box>
        </Box>
      </Box>
    </Page>
  );
};

export default ProhibitedJurisdiction;
