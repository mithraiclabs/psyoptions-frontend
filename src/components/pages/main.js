import React from 'react'
import { isBrowser } from '../../utils/isNode'
import WalletStatus from '../WalletStatus'

import Box from '@material-ui/core/Box'

const MainPage = () => {
  return (
    <Box p={2} align="center">
      <h2>
        Buy And Sell Options
        <br /> on Solana
      </h2>
      <div suppressHydrationWarning={true}>{isBrowser && <WalletStatus />}</div>
    </Box>
  )
}

export default MainPage
