import React from 'react'
import Box from '@material-ui/core/Box'
import Link from '@material-ui/core/Link'
import theme from '../utils/theme'

const Footer = () => (
  <Box align="center" p={3}>
    <Box p={1} fontSize={12}>
      Made by mithraiclabs
    </Box>
    <Box p={0} fontSize={12}>
      <Link
        color={theme.palette.primary.main}
        href="https://twitter.com/PsyOptions"
      >
        twitter
      </Link>{' '}
      |{' '}
      <Link
        color={theme.palette.primary.main}
        href="https://github.com/mithraiclabs"
      >
        github
      </Link>{' '}
      |{' '}
      <Link color={theme.palette.primary.main} href="https://t.me/psyoptions">
        telegram
      </Link>{' '}
      |{' '}
      <Link
        color={theme.palette.primary.main}
        href="https://discord.gg/cVHFVA4b"
      >
        discord
      </Link>{' '}
      |{' '}
      <Link
        color={theme.palette.primary.main}
        href="https://docs.google.com/forms/d/e/1FAIpQLSdJTqU3eg5dvxNm2KFcQM_zWibdoMKVW3Szjy3V0XOKk4P9jA/viewform"
      >
        contact form
      </Link>
    </Box>
  </Box>
)

export default Footer
