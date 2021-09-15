import React from 'react';
import { func, bool } from 'prop-types';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Box from '@material-ui/core/Box';
import Refresh from '@material-ui/icons/Refresh';

const RefreshButton: React.FC<{
  loading: boolean;
  onRefresh: () => void;
}> = ({ loading, onRefresh }) => {
  const handleRefresh = () => {
    if (!loading) {
      onRefresh();
    }
  };

  return (
    <Button variant="outlined" color={'primary'} onClick={handleRefresh}>
      {loading ? (
        <Box py={'3px'}>
          <CircularProgress size={18} />
        </Box>
      ) : (
        <Refresh />
      )}
    </Button>
  );
};

RefreshButton.propTypes = {
  loading: bool,
  onRefresh: func.isRequired,
};

export default RefreshButton;
