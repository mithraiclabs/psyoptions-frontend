import React, { useEffect } from 'react'
import { Switch, Route, useHistory, useLocation } from 'react-router-dom'
import Box from '@material-ui/core/Box'

import StatusBar from '../../StatusBar'
import Notifications from '../../Notifications'

import StepIndicator from './SimpleUIStepIndicator'
import PageTitle from './SimpleUIPageTitle'
import ChooseAnAsset from './routes/ChooseAnAsset'
import UpOrDown from './routes/UpOrDown'
import ChooseExpiration from './routes/ChooseExpiration'

const pageBg =
  'linear-gradient(360deg, #42203B 14.41%, rgba(27, 26, 45, 0.81) 55.79%, #101017 93.84%), #101017'

export const SimpleUI: React.FC = () => {
  const history = useHistory()
  const location = useLocation()

  useEffect(() => {
    // Redirect base path back to homepage
    if (location?.pathname.match(/\/simple\/?$/)) {
      history.replace('/')
    }
  }, [location, history])

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
          <PageTitle />
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
            <Switch>
              <Route component={ChooseAnAsset} path="/simple/choose-asset" />
              <Route component={UpOrDown} path="/simple/up-or-down" />
              <Route
                component={ChooseExpiration}
                path="/simple/choose-expiration"
              />
            </Switch>
          </Box>
        </Box>
      </Box>
    </>
  )
}
