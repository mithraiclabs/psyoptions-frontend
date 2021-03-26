import React from 'react'
import { func, bool } from 'prop-types'
import { Button, CircularProgress, Box } from '@material-ui/core'
import Refresh from '@material-ui/icons/Refresh'

const RefreshButton = ({ loading, onRefresh }) => {
  const handleRefresh = () => {
    if (!loading) {
      onRefresh()
    }
  }

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
  )
}

RefreshButton.propTypes = {
  loading: bool,
  onRefresh: func.isRequired,
}

export default RefreshButton
