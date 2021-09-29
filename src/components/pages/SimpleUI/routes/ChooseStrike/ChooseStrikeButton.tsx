import React from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { useTheme } from '@material-ui/core/styles';

const ChooseStrikeButton: React.VFC<{
  strike: string;
  bid: number | null;
  ask: number | null;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}> = ({
  strike,
  bid,
  ask,
  selected,
  onClick,
  disabled
}) => {
  const theme = useTheme();

  return (
    <Button
      fullWidth
      style={{
        padding: 0,
        border: selected
          ? `1px solid ${theme.palette.primary.light}`
          : `1px solid rgba(139, 234, 255, 0)`,
        boxShadow: selected ? `inset 0 0 20px rgba(139, 234, 255, 0.25)` : '',
        background: 'rgba(255, 255, 255, 0.05)',
      }}
      onClick={onClick}
      disabled={disabled}
    >
      <Box
        width='100%'
        display='flex'
        flexDirection='column'
        textAlign='left'
        p={1}
        color={theme?.palette?.primary?.light}
        fontSize={'16px'}
      >
        <Box paddingLeft={1}>
          <div style={{
              margin: 0,
              fontSize: 20,
              fontFamily: 'Goldman',
              fontWeight: 'bold'
            }}
          >${strike}</div>
        </Box>
        <Box
          width='100%'
          display='flex'
          flexDirection='row'
          justifyContent='space-between'
          paddingLeft={1}
          paddingRight={1}
        >
          <Box>{bid ? `Bid: $${bid}`: 'Bid: None'}</Box>
          <Box>{ask ? `Ask: $${ask}`: 'Ask: None'}</Box>
        </Box>
      </Box>
    </Button>
  );
};

export default ChooseStrikeButton;
