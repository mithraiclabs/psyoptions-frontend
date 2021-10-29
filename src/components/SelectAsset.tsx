import React, { useMemo, useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import Chip from '@material-ui/core/Chip';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import { useTheme, withStyles } from '@material-ui/core/styles';
import { PublicKey } from '@solana/web3.js';
import { useNetworkTokens, useTokenByMint } from '../hooks/useNetworkTokens';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';

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
  const theme = useTheme();
  const tokens = useNetworkTokens();
  const asset = useTokenByMint(value ?? '');
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const filteredMints = useMemo(() => {
    const lowerFilter = filter.toLowerCase();
    return mints.filter((mint) => {
      const token = tokens[mint.toString()];

      return !!token?.symbol.toLowerCase().match(lowerFilter);
    });
  }, [filter, mints, tokens]);
  const onFilterChange: React.ChangeEventHandler<HTMLInputElement> = (e) =>
    setFilter(e.target.value);
  const chipLabel = asset
    ? asset.symbol
    : value
    ? value.toString()
    : 'Loading...';
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
              {filteredMints.map((mint) => {
                // TODO refactor this to it's own component
                const token = tokens[mint.toString()];
                return (
                  <ListItem
                    button
                    onClick={() => {
                      setOpen(false);
                      onChange(mint);
                    }}
                    key={mint.toString()}
                  >
                    {token && (
                      <ListItemAvatar>
                        <Avatar src={token.logoURI} />
                      </ListItemAvatar>
                    )}
                    <ListItemText primary={token?.symbol ?? mint.toString()} />
                  </ListItem>
                );
              })}
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
          asset ? (
            <Avatar
              src={asset.logoURI}
              alt={asset.name}
              style={{
                backgroundColor: theme.palette.primary.main,
              }}
            />
          ) : undefined
        }
        onClick={disabled ? undefined : handleOpen}
        onDelete={disabled ? undefined : handleOpen}
        deleteIcon={disabled ? undefined : <KeyboardArrowDown />}
      />
    </>
  );
};
