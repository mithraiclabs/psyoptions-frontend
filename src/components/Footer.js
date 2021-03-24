import React from 'react'
import Box from '@material-ui/core/Box'
import Link from '@material-ui/core/Link'

const Footer = () => (
  <Box align="center" p={3}>
    <Box p={1} fontSize={12}>
      Made by mithraiclabs
    </Box>
    <Box p={0} fontSize={12}>
      <Link color="primary" href="https://twitter.com/PsyOptions">
        twitter
      </Link>{' '}
      |{' '}
      <Link color="primary" href="https://github.com/mithraiclabs">
        github
      </Link>{' '}
      |{' '}
      <Link color="primary" href="https://t.me/psyoptions">
        telegram
      </Link>{' '}
      |{' '}
      <Link color="primary" href="https://discord.gg/cVHFVA4b">
        discord
      </Link>{' '}
      |{' '}
      <Link
        color="primary"
        href="https://docs.google.com/forms/d/e/1FAIpQLSdJTqU3eg5dvxNm2KFcQM_zWibdoMKVW3Szjy3V0XOKk4P9jA/viewform"
      >
        contact form
      </Link>
    </Box>
  </Box>
)

export default Footer
