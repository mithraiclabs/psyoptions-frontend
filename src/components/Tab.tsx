import React from 'react';
import { withStyles, withTheme } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';

const StyledButton = withStyles(() => ({
  root: {
    padding: 0,
    borderRadius: '4px 4px 0px 0px',
    width: 'fit-content',
    marginRight: '4px',
  },
}))(Button);

const Tab = ({ children, selected, theme, onClick }) => {
  return (
    <StyledButton onClick={onClick}>
      <Box
        pt={1}
        pb={selected ? '14px' : '6px'}
        pr={2}
        pl={1}
        style={{ borderRadius: '4px 4px 0px 0px' }}
        bgcolor={theme.palette.background[selected ? 'tabHighlight' : 'medium']}
      >
        {children}
      </Box>
    </StyledButton>
  );
};

export default withTheme(Tab);
