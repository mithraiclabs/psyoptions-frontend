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
  const assetList = useAssetList()

  const [open, setOpen] = useState(false)
  const [filterInput, setFilterInput] = useState('')

  const filteredAssetList = assetList.filter((item) => {
    const match = filterInput.toLowerCase()
    const shouldAppear =
      item.name.toLowerCase().match(match) ||
      item.symbol.toLowerCase().match(match)
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
          <Box width="350px" display="flex" flexDirection="column">
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
            <Box my={3} height="300px" overflow={'auto'}>
              {filteredAssetList.map((asset) => {
                return (
                  <ListItem
                    button
                    onClick={() => {
                      setOpen(false)
                      onSelectAsset(asset)
                    }}
                    key={asset.mint}
                  >
                    <ListItemAvatar>
                      <Avatar src={asset.image} />
                    </ListItemAvatar>
                    <ListItemText primary={`${asset.name} (${asset.symbol})`} />
                  </ListItem>
                )
              })}
            </Box>
          </Box>
        </Box>
      </Dialog>
      <Chip
        label={selectedAsset ? selectedAsset.name : 'Choose Asset'}
        clickable
        color="primary"
        variant="outlined"
        avatar={
          selectedAsset ? (
            <Avatar
              src={selectedAsset.image}
              alt={selectedAsset.name}
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
