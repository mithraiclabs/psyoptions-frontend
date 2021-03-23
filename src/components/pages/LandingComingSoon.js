import React from 'react'
import { Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'

import logo from '../../../assets/psyoptions-logo-light.png'
import theme from '../../utils/theme'
import Footer from '../Footer'

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
  landingCard: {
    borderRadius: '4px',
    border: `1px solid ${theme.palette.primary.main}`,
  },
})

const pageBg =
  'linear-gradient(0deg, rgba(66, 32, 59, 1) 0%, rgba(27, 26, 45, 1) 35%, rgba(16, 16, 23, 1) 70%)'

const PageWithoutNav = ({ children }) => (
  <Box
    minHeight="100%"
    display="flex"
    flexDirection="column"
    style={{ background: pageBg }}
  >
    <Box
      px={[0, 0, 4]}
      minHeight="100%"
      display="flex"
      flexDirection="column"
      flexGrow={1}
      justifyContent="center"
    >
      <Box minHeight="100%">{children}</Box>
    </Box>
    <Footer />
  </Box>
)

const LandingComingSoon = () => {
  const { logoH1 } = useStyles()

  return (
    <PageWithoutNav>
      <Box
        display="flex"
        justifyContent="center"
        flexDirection="column"
        minHeight="100%"
        pb={4}
      >
        <Box
          display="flex"
          flexDirection={['column', 'column', 'row']}
          alignItems="center"
          justifyContent="center"
          mt={2}
          p={3}
        >
          <img width="95px" height="95px" src={logo} alt="PsyOptions Logo" />
          <Box px={[1, 1, 3]} fontSize={['48px', '48px', '60px', '72px']}>
            <h1 className={logoH1}>PsyOptions</h1>
          </Box>
        </Box>
        <Box
          display="flex"
          flexDirection={['column', 'column', 'column']}
          alignItems="center"
          justifyContent="center"
          p={2}
          textAlign="center"
        >
          <h2 style={{ margin: '5px 0' }}>Decentralized Options Protocol</h2>
          <h2 style={{ margin: '5px 0' }}>Coming Soon</h2>
        </Box>
      </Box>
    </PageWithoutNav>
  )
}

export default LandingComingSoon
