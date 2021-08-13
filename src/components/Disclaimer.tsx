import React from 'react'
import Dialog from '@material-ui/core/Dialog'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import useLocalStorageState from 'use-local-storage-state'

const Disclaimer = () => {
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] =
    useLocalStorageState('hasAcceptedDisclaimer', false)

  const dismissDisclaimer = () => {
    setHasAcceptedDisclaimer(true)
  }

  return (
    <Dialog open={!hasAcceptedDisclaimer} maxWidth={'lg'}>
      <Box p={2} width="740px" maxWidth="100%">
        <Box px={1} py={2} textAlign="center">
          <h2 style={{ margin: '0' }}>Warning!</h2>
        </Box>
        <Box fontWeight={400}>
          <Box p={1}>
            PsyOptions is beta software and is a fully decentralized options
            protocol. No representation or warranty is made concerning any
            aspect of PsyOptions, including its suitability, quality,
            availability, accessibility, accuracy or safety. Your access to and
            use of PsyOptions is entirely at your own risk and could lead to
            substantial losses. You take full responsibility for your use of
            PsyOptions, and acknowledge that you use it on the basis of your own
            enquiry.
          </Box>
          <Box p={1}>
            PsyOptions is not available to residents of:{' '}
            <span style={{ fontWeight: 700 }}>
              Belarus, the Central African Republic, the Democratic Republic of
              Congo, the Democratic People’s Republic of Korea, the Crimea
              region of Ukraine, Cuba, Iran, Libya, Somalia, Sudan, South Sudan,
              Syria, the USA, Yemen, and Zimbabwe or any other jurisdiction in
              which accessing or using this website is prohibited.{' '}
            </span>
          </Box>
          <Box p={1}>
            In using PsyOptions, you confirm that you are not located in,
            incorporated or otherwise established in, or a citizen or resident
            of any of the above jurisdictions.
          </Box>
        </Box>
        <Box px={1} py={2} textAlign="center">
          <Button
            color="primary"
            variant="outlined"
            onClick={dismissDisclaimer}
          >
            Accept and Continue
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default Disclaimer
