import React, { useCallback, useMemo, useState } from 'react';
import Button from '@material-ui/core/Button';
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
import { PublicKey } from '@solana/web3.js';

import { Token } from '@mithraic-labs/market-meta/dist/types';
import useAssetList from '../hooks/useAssetList';

const CustomChip = withStyles({
  disabled: {
    border: '1px solid transparent',
    opacity: '1 !important',
  },
  root: {
    maxWidth: '-webkit-fill-available',
  },
})(Chip);

export const SelectAssetOrEnterMint: React.VFC<{
  label?: string;
  mint: PublicKey | null;
  onSelectAsset: (mint: PublicKey) => void;
  disabled?: boolean;
}> = ({ label = 'Select Asset', mint, onSelectAsset, disabled = false }) => {
  const theme = useTheme();
  const { supportedAssets, assetListLoading, tokenMap } = useAssetList();
  const token: Token | undefined = tokenMap[mint?.toString() ?? ''];
  const [open, setOpen] = useState(false);
  const [filterInput, setFilterInput] = useState('');

  const filteredAssetList = useMemo(
    () =>
      supportedAssets.filter((item) => {
        const match = filterInput.toLowerCase();
        const shouldAppear =
          (item.tokenName.toLowerCase().match(match) ||
            item.tokenSymbol.toLowerCase().match(match)) &&
          !item.tokenSymbol.toLowerCase().match('usdc');
        return shouldAppear;
      }),
    [filterInput, supportedAssets],
  );

  const updateMintWithTextInput = useCallback(() => {
    onSelectAsset(new PublicKey(filterInput));
    setOpen(false);
  }, [filterInput, onSelectAsset]);
  const onTextChange = useCallback((e) => {
    setFilterInput(e.target.value);
  }, []);

  const handleOpen = () => {
    setFilterInput(mint?.toString() ?? '');
    setOpen(true);
  };

  const chipLabel = assetListLoading
    ? 'Loading...'
    : token?.tokenSymbol || mint?.toString() || 'Choose Asset';

  return (
    <Box display="flex" overflow="hidden">
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
                label="Filter or enter mint"
                variant="filled"
                onChange={onTextChange}
                value={filterInput}
                style={{
                  width: '100%',
                }}
              />
            </Box>
            <Box display="flex" justifyContent="flex-end">
              <Button color="primary" onClick={updateMintWithTextInput}>
                Update mint
              </Button>
            </Box>
            <Box my={3} height="300px" overflow="auto">
              {filteredAssetList.map((asset) => (
                <ListItem
                  button
                  onClick={() => {
                    setOpen(false);
                    onSelectAsset(new PublicKey(asset.mintAddress));
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
        color="primary"
        variant="outlined"
        disabled={disabled}
        avatar={
          token ? (
            <Avatar
              src={token.icon}
              alt={token.tokenName}
              style={{
                backgroundColor: theme.palette.primary.main,
              }}
            >
              {assetListLoading ? '?' : ''}
            </Avatar>
          ) : undefined
        }
        onClick={handleOpen}
        onDelete={handleOpen}
        deleteIcon={disabled ? undefined : <KeyboardArrowDown />}
      />
    </Box>
  );
};
