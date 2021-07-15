import React, { useEffect } from 'react'
import { Switch, Route, useHistory, useLocation } from 'react-router-dom'
import Box from '@material-ui/core/Box'
// import Button from '@material-ui/core/Button'
import { useTheme } from '@material-ui/core/styles'

import StatusBar from '../../StatusBar'
import Notifications from '../../Notifications'

// const Page = ({ children, background, center = true }) => (

//         <Box minHeight="100%">{children}</Box>

// )

// Temp, move these to own components later
const ChooseAsset = () => {
  return <Box p={2} />
}

const UpOrDown = () => {
  return <h3>Choose Asset</h3>
}

const StepIndicator = ({ on = false }) => {
  const theme = useTheme()
  const { primary, background } = theme?.palette as any

  return (
    <Box
      width="16%"
      height={'4px'}
      borderRadius={'2px'}
      bgcolor={on ? primary?.main : background?.light}
    />
  )
}

// import logo from '../../../../assets/psyoptions-logo-light.png'
// import theme from '../../../utils/theme'
// import useOptionsMarkets from '../../../hooks/useOptionsMarkets'
// import useOpenPositions from '../../../hooks/useOpenPositions'
// import WalletStatus from '../../WalletStatus'

const pageBg =
  'linear-gradient(360deg, #42203B 14.41%, rgba(27, 26, 45, 0.81) 55.79%, #101017 93.84%), #101017'

export const SimpleUI: React.FC = () => {
  // const theme = useTheme()
  const history = useHistory()
  const location = useLocation()

  // const { markets } = useOptionsMarkets()
  // const positions = useOpenPositions()
  // const { logoH1 } = useStyles()
  // const { landingCard } = useStyles()

  useEffect(() => {
    // Go to choose asset screen by default
    if (location?.pathname.match(/\/simple\/?$/)) {
      history.replace('/simple/choose-asset')
    }
  }, [location, history])

  let pageTitle = ''
  // let pageSubTitle = ''
  if (location?.pathname.match(/\/simple\/choose-asset\/?$/)) {
    pageTitle = 'Choose An Asset'
  }
  if (location?.pathname.match(/\/simple\/up-or-down\/?$/)) {
    pageTitle = `I think it's going...`
  }

  return (
    <>
      <Notifications />
      <Box
        minHeight="100%"
        display="flex"
        flexDirection="column"
        style={{ background: pageBg }}
      >
        <StatusBar />
        <Box
          p={2}
          pt={[3, 3, 4]}
          display="flex"
          justifyContent="space-between"
          flexDirection="row"
          width="100%"
          maxWidth="400px"
          mx={'auto'}
        >
          <StepIndicator on />
          <StepIndicator />
          <StepIndicator />
          <StepIndicator />
          <StepIndicator />
          <StepIndicator />
        </Box>
        <Box maxWidth="400px" mx={'auto'} p={2}>
          <h3 style={{ margin: 0 }}>{pageTitle}</h3>
        </Box>
        <Box
          px={[0, 0, 4]}
          minHeight="100%"
          display="flex"
          flexDirection="column"
          flexGrow={1}
          justifyContent={'center'}
        >
          <Box
            display="flex"
            justifyContent={['flex-start', 'flex-start', 'center']}
            alignItems="center"
            flexDirection="column"
            minHeight="100%"
            pb={4}
            maxWidth={'400px'}
            mx={'auto'}
          >
            <Switch>
              <Route component={ChooseAsset} path="/simple/choose-asset" />
              <Route component={UpOrDown} path="/simple/up-or-down" />
            </Switch>
          </Box>
        </Box>
      </Box>
    </>
  )
}
