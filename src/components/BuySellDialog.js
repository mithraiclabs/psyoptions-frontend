import React, { useState } from 'react'
import {
  // Dialog,
  // Chip,
  Box,
  TextField,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  useTheme,
} from '@material-ui/core'
// import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown'
// import { debounce } from 'throttle-debounce'

// import useAssetList from '../hooks/useAssetList'

const BuySellDialog = ({}) => {
  const theme = useTheme()

  return (
    <Box px={3}>
      <h2>{label}</h2>
      <Box
        width="350px"
        maxWidth="100%"
        display="flex"
        flexDirection="column"
      ></Box>
    </Box>
  )
}

BuySellDialog.defaultProps = {
  label: 'Select Asset',
  onSelectAsset: () => {},
}

export default BuySellDialog
