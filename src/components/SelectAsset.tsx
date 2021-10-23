import React, { useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import Chip from '@material-ui/core/Chip';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import { useTheme, withStyles } from '@material-ui/core/styles';
import { PublicKey } from '@solana/web3.js';

const CustomChip = withStyles({
  disabled: {
    border: '1px solid transparent',
    opacity: '1 !important',
  },
})(Chip);

export const SelectAsset: React.VFC<{
  disabled?: boolean;
  onChange: (key: PublicKey) => void;
  label?: string;
  mints: PublicKey[];
  value: PublicKey | null;
}> = ({ disabled = false, label, mints, onChange, value }) => {
  // const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const onFilterChange: React.ChangeEventHandler<HTMLInputElement> = (e) =>
    setFilter(e.target.value);
  // TODO this next line is throwing some error about negative
  const chipLabel = value ? value.toString() : 'Loading...';
  const handleOpen = () => setOpen(true);

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
                onChange={onFilterChange}
                style={{
                  width: '100%',
                }}
              />
            </Box>
            <Box my={3} height="300px" overflow="auto">
              {mints.map((mint) => (
                <ListItem
                  button
                  onClick={() => {
                    setOpen(false);
                    onChange(mint);
                  }}
                  key={mint.toString()}
                >
                  {/* 
                  TODO figure out how to get avatar based on mint
                  <ListItemAvatar>
                    <Avatar src={asset.icon} />
                  </ListItemAvatar> */}
                  <ListItemText primary={mint.toString()} />
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
        // avatar={
        //   selectedAsset ? (
        //     <Avatar
        //       src={selectedAsset.icon}
        //       alt={selectedAsset.tokenName}
        //       style={{
        //         backgroundColor: theme.palette.primary.main,
        //       }}
        //     >
        //       {assetListLoading ? '?' : ''}
        //     </Avatar>
        //   ) : null
        // }
        onClick={disabled ? undefined : handleOpen}
        onDelete={disabled ? undefined : handleOpen}
        deleteIcon={disabled ? undefined : <KeyboardArrowDown />}
      />
    </>
  );
};
