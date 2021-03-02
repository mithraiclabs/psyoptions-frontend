import React, { useState } from 'react'
import {
  Dialog,
  Chip,
  Box,
  TextField,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  useTheme,
} from '@material-ui/core'
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown'
import { debounce } from 'throttle-debounce'

import useAssetList from '../hooks/useAssetList'

const SelectAsset = ({ label, selectedAsset, onSelectAsset }) => {
  const theme = useTheme()
  const { supportedAssets } = useAssetList()

  const [open, setOpen] = useState(false)
  const [filterInput, setFilterInput] = useState('')

  const filteredAssetList = supportedAssets.filter((item) => {
    const match = filterInput.toLowerCase()
    const shouldAppear =
      item.tokenName.toLowerCase().match(match) ||
      item.tokenSymbol.toLowerCase().match(match)
    return shouldAppear
  })

  const handleChangeFilterInput = debounce(200, false, (e) => {
    setFilterInput(e.target.value)
  })

  const handleOpen = () => {
    setFilterInput('')
    setOpen(true)
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby={label}
      >
        <Box px={3}>
          <h2>{label}</h2>
          <Box
            width="350px"
            maxWidth="100%"
            display="flex"
            flexDirection="column"
          >
            <Box>
              <TextField
                label="Search"
                variant="filled"
                onChange={handleChangeFilterInput}
                style={{
                  width: '100%',
                }}
              />
            </Box>
            <Box my={3} height="300px" overflow="auto">
              {filteredAssetList.map((asset) => (
                <ListItem
                  button
                  onClick={() => {
                    setOpen(false)
                    onSelectAsset(asset)
                  }}
                  key={asset.mintAddress}
                >
                  <ListItemAvatar>
                    <Avatar src={asset.icon} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${asset.tokenName} (${asset.tokenSymbol})`}
                  />
                </ListItem>
              ))}
            </Box>
          </Box>
        </Box>
      </Dialog>
      <Chip
        label={selectedAsset ? selectedAsset.tokenName : 'Choose Asset'}
        clickable
        color="primary"
        variant="outlined"
        avatar={
          selectedAsset ? (
            <Avatar
              src={selectedAsset.icon}
              alt={selectedAsset.tokenName}
              style={{
                backgroundColor: theme.palette.primary.main,
              }}
            />
          ) : null
        }
        onClick={handleOpen}
        onDelete={handleOpen}
        deleteIcon={<KeyboardArrowDown />}
      />
    </>
  )
}

SelectAsset.defaultProps = {
  label: 'Select Asset',
  onSelectAsset: () => {},
}

export default SelectAsset
