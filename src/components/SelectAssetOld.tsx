import React, { useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import Chip from '@material-ui/core/Chip';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import ListItemText from '@material-ui/core/ListItemText';
import { useTheme, withStyles } from '@material-ui/core/styles';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import { debounce } from 'throttle-debounce';

import { Token } from '@mithraic-labs/market-meta/dist/types';
import useAssetList from '../hooks/useAssetList';

const CustomChip = withStyles({
  disabled: {
    border: '1px solid transparent',
    opacity: '1 !important',
  },
})(Chip);

/**
 * @deprecated use SelectAsset instead
 */
const SelectAsset: React.FC<{
  label?: string;
  selectedAsset: Token;
  onSelectAsset?: (asset: Token) => void;
  disabled?: boolean;
}> = ({
  label = 'Select Asset',
  selectedAsset,
  onSelectAsset,
  disabled = false,
}) => {
  const theme = useTheme();
  const { supportedAssets, assetListLoading } = useAssetList();

  const [open, setOpen] = useState(false);
  const [filterInput, setFilterInput] = useState('');

  const filteredAssetList = supportedAssets.filter((item) => {
    const match = filterInput.toLowerCase();
    const shouldAppear =
      (item.tokenName.toLowerCase().match(match) ||
        item.tokenSymbol.toLowerCase().match(match)) &&
      !item.tokenSymbol.toLowerCase().match('usdc');
    return shouldAppear;
  });

  const handleChangeFilterInput = debounce(200, false, (e) => {
    setFilterInput(e.target.value);
  });

  const handleOpen = () => {
    setFilterInput('');
    setOpen(true);
  };

  const chipLabel = assetListLoading
    ? 'Loading...'
    : selectedAsset?.tokenSymbol || 'Choose Asset';

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
                    setOpen(false);
                    onSelectAsset(asset);
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
      <CustomChip
        label={chipLabel}
        clickable={!disabled}
        color={'primary'}
        variant="outlined"
        disabled={disabled}
        avatar={
          selectedAsset ? (
            <Avatar
              src={selectedAsset.icon}
              alt={selectedAsset.tokenName}
              style={{
                backgroundColor: theme.palette.primary.main,
              }}
            >
              {assetListLoading ? '?' : ''}
            </Avatar>
          ) : null
        }
        onClick={disabled ? null : handleOpen}
        onDelete={disabled ? null : handleOpen}
        deleteIcon={disabled ? null : <KeyboardArrowDown />}
      />
    </>
  );
};

export default SelectAsset;
