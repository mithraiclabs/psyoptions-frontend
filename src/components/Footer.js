import React from 'react'
import Box from '@material-ui/core/Box'
import Link from '@material-ui/core/Link'

const Footer = () => (
  <Box align="center" p={3}>
    <Box p={1} fontSize={12}>
      Made by mithraiclabs
    </Box>
    <Box p={0} fontSize={12}>
      <Link href="https://twitter.com/PsyOptions">twitter</Link> |{' '}
      <Link href="https://github.com/mithraiclabs">github</Link> |{' '}
      <Link href="mailto:mithraiclabs@gmail.com">mithraiclabs@gmail.com</Link>
    </Box>
  </Box>
)

export default Footer
